
import ORY from "@ory/client";
import HYDRA from '@ory/hydra-client';
// import { RequiredError } from '@ory/client/dist/base.js';

// console.log(process.env);

// Record URLs for the OAuth2 and Admin API endpoints
let ory_oauth_endpoint: string | undefined;
let ory_admin_endpoint: string | undefined;
if (typeof process.env.ORY_OAUTH2_API_ENDPOINT !== 'string') {
    throw new Error(`auth.ts - ORY_OAUTH2_API_ENDPOINT required`);
} else {
    ory_oauth_endpoint = process.env.ORY_OAUTH2_API_ENDPOINT;
}
if (typeof process.env.ORY_ADMIN_API_ENDPOINT !== 'string') {
    throw new Error(`auth.ts - ORY_ADMIN_API_ENDPOINT required`);
} else {
    ory_admin_endpoint = process.env.ORY_ADMIN_API_ENDPOINT;
}

// Check whether we are to use the ORY or HYDRA client packages
let useORY = typeof process.env.USE_ORY === 'string';
let useHYDRA = typeof process.env.USE_HYDRA === 'string';

if (useORY && useHYDRA) {
    throw new Error(`auth.ts - can only select one of USE_ORY or USE_HYDRA, not both`);
}

if (!useORY && !useHYDRA) {
    throw new Error(`auth.ts - Must select one of USE_ORY or USE_HYDRA`);
}

// Configure the ory variable to use either ORY or HYDRA.
// They're both nearly the same or identical API and one
// can be substituted for the other.
let ory: ORY.OAuth2Api | HYDRA.OAuth2Api | undefined;
if (useORY) {
    ory = new ORY.OAuth2Api(
        new ORY.Configuration({
            basePath: ory_admin_endpoint,
            accessToken: process.env.ORY_NET_API_KEY,
        }),
    );
} else if (useHYDRA) {
    ory = new HYDRA.OAuth2Api(
        new HYDRA.Configuration({
            basePath: ory_admin_endpoint
        })
    );
}
if (!ory) {
    throw new Error(`auth.ts - No OAuth2Api object constructed`);
}

import got from "got";

import util from 'node:util';

import { Request, Response } from 'express';
import { Context } from 'openapi-backend';
import YAML from "js-yaml";
import { logger } from "./app.js";
import {
    ClientCredentialRequest,
    isClientCredentialRequest,
    isOryIntrospectedOAuth2Token,
    Problem,
    reportProblem
} from './types.js';

/**
 * Handler for the /auth/token endpoint, which calls
 * the ORY OAuth2 service to generate an auth token.
 * 
 * @param c 
 * @param req 
 * @param res 
 * @returns 
 */
export async function fetchToken(
    c: Context, req: Request, res: Response
) {
    logger.info(`fetchToken ${YAML.dump({
        method: c?.request?.method,
        path: c?.request?.path,
        headers: c?.request?.headers,
        query: c?.request?.query,
        body: c?.request?.body,
        params: c?.request?.params,
        requestBody: c?.request?.requestBody,
        errors: c?.validation?.errors,
        reqHeaders: req?.headers,
        reqParams: req?.params,
        reqQuery: req?.query,
        reqBody: req?.body,
        reqRAW: req?.rawHeaders,
        // opReqBody: c?.operation?.requestBody,
        opParams: c?.operation?.parameters
    }, { indent: 4 })}`);

    const ccrequest
        = isClientCredentialRequest(c?.request?.body);

    if (ccrequest.error || !ccrequest.value) {
        const msg = `fetchToken bad ClientCredentialRequest ${util.inspect(ccrequest.error?.details)} for ${YAML.dump({ ccrequest: ccrequest.value }, { indent: 4 })}`;
        logger.error(msg);
        return res.status(400).json(reportProblem(msg, 400));
    }

    const credentials: ClientCredentialRequest
                = ccrequest.value;
    
    let clientData;
    try {
        clientData = await getOAuth2ClientInfo(credentials.client_id);
    } catch (err: any) {
        return res.status(500).json(reportProblem(
            `fetchToken FAIL Did not receive client INFO because ${err.message}`,
            500));
    }

    if (!clientData) {
        return res.status(500).json(reportProblem(
            `fetchToken FAIL Did not receive client INFO for unknown reason`,
            500));
    }

    if (typeof credentials.scope === 'undefined'
     || (typeof credentials.scope === 'string'
        && credentials.scope.length === 0)
    ) {
        logger.warn(`fetchToken empty scope -- token will be generated using default scope`);

        credentials.scope = clientData.scope;
    }

    if (!credentials.scope) {
        return res.status(500).json(reportProblem(
            `fetchToken FAIL No scope known for client`,
            500));
    }
    
    const valid = isValidScopeString(credentials.scope);

    if (!valid.okay) {
        const msg = `fetchToken bad ClientCredentialRequest scope because ${valid?.message}`;
        logger.error(msg);
        return res.status(400).json(reportProblem(msg, 400));
    }

    let oryServer;
    try {
        oryServer = new URL(ory_oauth_endpoint as string);
        oryServer.pathname = 'oauth2/token';
    } catch (err: any) {
        let statusCode = 500;
        const msg = `fetchToken FAIL InternalServiceError could not construct ORY URL from ${ory_oauth_endpoint}`;
        logger.error(msg);
        logger.error(err.stack);
        return res.status(statusCode).json(reportProblem(msg, statusCode));
    }

    let resp;
    const options = {
        // Got autoconverts this to use
        //
        // Content-Type
        // application/x-www-form-urlencoded
        //
        // And to use URLSearchParams to
        // encode the form field
        // which is exactly what's required
        form: credentials
    };
    logger.info(`fetchToken TRYING ${oryServer.href} ${util.inspect(options)}`);

    try {
        resp = await got.post(
            oryServer.href, options
        );
    } catch (err: any) {
        let statusCode = err.code;
        const msg = `fetchToken FAIL ${err.name} (${statusCode}) ${oryServer.href} with ${err.message} `;
        logger.error(msg);
        logger.error(err.stack);
        return res.status(statusCode).json(reportProblem(msg, statusCode));
    }

    // console.log(resp.body);
    if (resp) {
        return res.status(200).json(resp.body);
    } else {
        const msg = `fetchToken unknown problem`;
        logger.error(msg);
        return res.status(400).json(reportProblem(msg, 400));
    }
}

/**
 * Handle security validation requests issued by OpenAPI-Backend.
 * This looks for a Bearer token in the Authorization header,
 * using the Ory server to validate the token.
 *
 * @param c 
 * @param req 
 * @param res 
 * @returns 
 */
export async function oath2ClientHandler(
    c: Context, req: Request, res: Response
) {

    const authHeader = c.request.headers['authorization'];
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    if (!(typeof authHeader === 'string')) {
        throw new Error(`Authorization header an array? ${util.inspect(authHeader)}`);
    }
    // logger.info(`oath2ClientHandler request ${util.inspect(c.request.headers)} security ${util.inspect(c.security)} operation ${util.inspect(c?.operation)} operation.security ${util.inspect(c?.operation?.security)}`);

    let token = authHeader.replace('Bearer ', '');

    let decoded;
    let scopes;
    try {
        decoded = await introspectOAuth2Token(token);
        // const decoded = await isOryIntrospectedOAuth2Token(token);
        if (!decoded) {
            logger.error(`oath2ClientHandler FAIL ${util.inspect(decoded)}`);
            return false;
        }
        let okay = false;

        if (!decoded || !decoded.active) {
            logger.error(`oath2ClientHandler FAIL inactive token ${token} ${util.inspect(decoded)}`);
            return false;
        }

        scopes = decoded.scope?.split(' ');
    } catch (err: any) {
        logger.error(`oath2ClientHandler FAIL because introspectOAuth2Token threw ${err.message}`);
        throw err;
    }

    let ret = false;

    // logger.info(`oath2ClientHandler name ${util.inspect(decoded.sub)} tokens matched ${util.inspect(c?.operation)} operation.security ${util.inspect(c?.operation?.security)}`);;

    // const scopes = dtoken.scope.split(' ');
    if (Array.isArray(scopes)
     && scopes.length >= 1
     && c?.operation
     && c?.operation?.security
     && Array.isArray(c.operation.security)
     && c.operation.security.length >= 1) {
        for (const sec of c.operation.security) {
            // logger.info(`oath2ClientHandler ${util.inspect(scopes)} ${util.inspect(sec)}`);
            if ('oAuth2ClientCredentials' in sec
             && Array.isArray(sec.oAuth2ClientCredentials)
             && sec.oAuth2ClientCredentials.length >= 1) {

                // Intersection of two arrays
                // https://medium.com/@alvaro.saburido/set-theory-for-arrays-in-es6-eb2f20a61848

                // This compares the scopes (permissions)
                // stored in the token against the
                // client credentials named in the spec.
                // If there is overlap then it's approved.

                let found = scopes.filter(x => {
                    return sec.oAuth2ClientCredentials.includes(x);
                });
                if (Array.isArray(found)
                 && found.length >= 1) {
                    // logger.info(`oath2ClientHandler FOUND ${util.inspect(scopes)} ${util.inspect(sec.oAuth2ClientCredentials)} ${util.inspect(found)}`);
                    ret = true;
                    break;
                } else {
                    // logger.info(`oath2ClientHandler NOT FOUND ${util.inspect(scopes)} ${util.inspect(sec.oAuth2ClientCredentials)} ${util.inspect(found)}`);
                    ret = false;
                    break;
                }

            }
        }
    }

    // logger.info(`oath2ClientHandler ${authHeader} ${util.inspect(c.request.headers)} security ${util.inspect(c?.operation?.security)} token ${token} decoded ${util.inspect(decoded)}  ==> ${ret}`);

    return ret;
}

/**
 * Helper function to support reporting errors from Ory SDK.
 *
 * @param err 
 * @returns 
 */
function reportORYError(err: any): string {
    let ret = `ORY Error (${err.status} ${err.code} ${err.status === 429 ? 'Too many requests' : ''}) ${err.message} ${'statusText' in err ? err.statusText : ''} ${'cause' in err ? err.cause : ''}`;

    return ret;
}

/**
 * Given an accessToken, ask an Ory service to introspect
 * the token, which means to return the object referenced
 * by the token.
 *
 * @param accessToken 
 * @returns 
 */
export async function introspectOAuth2Token(accessToken: string)
    : Promise<ORY.IntrospectedOAuth2Token>
{

    try {
        if (!ory) {
            throw new Error(`auth.ts - No OAuth2Api object constructed`);
        }
        let data = (await ory.introspectOAuth2Token({
            token: accessToken
        })).data;
        
        const _data = isOryIntrospectedOAuth2Token(data);

        // console.log(util.inspect(_data));

        if (_data.error) {
            throw new Error(`introspectOAuth2Token retrieved ORY bad introspection ${util.inspect(_data.error)}`);
        }

        if (!_data.value || typeof _data.value === 'undefined') {
            throw new Error(`introspectOAuth2Token retrieved ORY introspection with no data`);
        }

        // logger.info(YAML.dump({
        //     title: `Introspected token`,
        //     _data
        // }, { indent: 4 }));

        return _data.value;
    } catch (err: any) {
        if (err instanceof Error) {
            throw err;
        }
        const msg = `introspectOAuth2Token ${reportORYError(err)}`;
        logger.error(msg);
        logger.error(err.stack);
        throw new Error(msg);
    }
}

/**
 * Given a client_id, retrieve the data object for that client.
 *
 * @param client_id 
 * @returns 
 */
export async function getOAuth2ClientInfo(client_id: string) {
    try {

        if (!ory) {
            throw new Error(`auth.ts - No OAuth2Api object constructed`);
        }
        let data = (await ory.getOAuth2Client({
                id: client_id
            })).data;

        console.log(`getOAuth2ClientInfo ${client_id} ==> ${util.inspect(data)}`);
        
        return data;
    } catch (err: any) {
        const msg = `getOAuth2ClientInfo ${client_id} ${reportORYError(err)}`;
        logger.error(msg);
        logger.error(err.stack);
        throw new Error(msg);
    }
}

/**
 * List of valid scope names
 */
export const scopeNames = [
    'post_echo',
    'read_date',
];

/**
 * Test whether a scope name is legitimate.
 * @param nm 
 * @returns 
 */
export function isScopeName(nm: string): boolean {
    return scopeNames.includes(nm);
}

/**
 * For a scope string, containing a space-seperated
 * list of scope names, check if the scope name is valid.
 *
 * @param scope 
 * @returns 
 */
export function isValidScopeString(scope: string)
: {
    okay: boolean,
    message?: string
} {
    
    for (const scopenm of scope.split(' ')) {
        if (scopenm === 'None') continue;
        if (!isScopeName(scopenm)) {
            return {
                okay: false,
                message: `Bad scope name ${scopenm}`
            };
        }
    }
    return {
        okay: true
    };
}
