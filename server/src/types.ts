import { IntrospectedOAuth2Token } from "@ory/client";
import Joi, { ValidationError } from "joi";

import { components } from "./spec-openapi-typescript.js";

export type echoThing = components["schemas"]["echoThing"];

export const joiEchoThing = Joi.object({
    title: Joi.string().required(),
    body: Joi.string().required()
});

export function isEchoThing(data: any)
: {
    error?: ValidationError;
    value?: echoThing
} {
    const { error, value } = joiEchoThing
    .validate(data, {
        allowUnknown: true
    });

    return { error, value };
}

export type dateResponse = components["schemas"]["dateResponse"];

export const joiDateResponse = Joi.object({
    date: Joi.string().isoDate().required()
});

export function isDateResponse(data: any)
: {
    error?: ValidationError;
    value?: dateResponse
} {
    const { error, value } = joiDateResponse
    .validate(data, {
        allowUnknown: true
    });

    return { error, value };
}

export type Problem = components["schemas"]["problem"];

export function reportProblem(title: string, status?: number, detail?: string): Problem {
    return <Problem>{
        title, status, detail
    };
}

export type ClientCredentialRequest = components["schemas"]["clientCredentialRequest"];

export type ClientCredentialResponse = components["schemas"]["clientCredentialResponse"];

// Copied from openadr-3-ts-types

export const joiClientCredentialRequest = Joi.object({
    grant_type: Joi.string()
        .allow("client_credentials")
        .description("OAuth2 grant type, must be 'client_credentials'")
        .only()
        .required(),
    client_id: Joi.string()
        .description("client ID to exchange for bearer token.")
        .required()
        .max(4096)
        .min(1),
    client_secret: Joi.string()
        .description("client secret to exchange for bearer token.")
        .required()
        .max(4096)
        .min(1),
    scope: Joi.string()
        .description("application defined scope.")
        .max(4096)
        .min(0),
    })
    .description(
        "Body of POST request to /auth/token. Note snake case per https://www.rfc-editor.org/rfc/rfc6749\n"
    )
    .unknown()

export function isClientCredentialRequest(data: any)
: {
    error?: ValidationError;
    value?: ClientCredentialRequest
} {
    const { error, value } = joiClientCredentialRequest
    .validate(data, {
        allowUnknown: true
    });

    return { error, value };
}

export const joiClientCredentialResponse = Joi.object({
    access_token: Joi.string()
        .description("access token povided by Authorization service")
        .required()
        .max(4096)
        .min(1),
    token_type: Joi.string()
        .allow("Bearer")
        .description("token type, must be Bearer.")
        .only()
        .required(),
    expires_in: Joi.number()
        .description("expiration period in seconds.")
        .integer(),
    refresh_token: Joi.string()
        .description("refresh token povided by Authorization service")
        .max(4096)
        .min(1),
    scope: Joi.string()
        .description("application defined scope.")
        .max(4096)
        .min(1),
    })
    .description(
        "Body response from /auth/token. Note snake case per https://www.rfc-editor.org/rfc/rfc6749\n"
    )
    .unknown();


export function isClientCredentialResponse(data: any)
: {
    error?: ValidationError;
    value?: ClientCredentialResponse
} {
    const { error, value } = joiClientCredentialResponse
    .validate(data, {
        allowUnknown: true
    });

    return { error, value };
}

// The comments here come from the ORY code
//    https://github.com/ory/sdk/blob/master/clients/client/typescript/api.ts
export const joiOryIntrospectedOAuth2Token = Joi.object({

    /**
     * Active is a boolean indicator of whether or not the presented token is currently active.  The specifics of a token\'s \"active\" state will vary depending on the implementation of the authorization server and the information it keeps about its tokens, but a \"true\" value return for the \"active\" property will generally indicate that a given token has been issued by this authorization server, has not been revoked by the resource owner, and is within its given time window of validity (e.g., after its issuance time and before its expiration time).
     * @type {boolean}
     * @memberof IntrospectedOAuth2Token
     */
    active: Joi.boolean().required(),

    /**
     * Audience contains a list of the token\'s intended audiences.
     * @type {Array<string>}
     * @memberof IntrospectedOAuth2Token
     */
    aud: Joi.array().items(Joi.string()).optional(),

    /**
     * ID is aclient identifier for the OAuth 2.0 client that requested this token.
     * @type {string}
     * @memberof IntrospectedOAuth2Token
     */
    client_id: Joi.string().optional(),

    /**
     * Expires at is an integer timestamp, measured in the number of seconds since January 1 1970 UTC, indicating when this token will expire.
     * @type {number}
     * @memberof IntrospectedOAuth2Token
     */
    exp: Joi.number().positive().optional(),

    // The definition is
    // Extra is arbitrary data set by the session.
    //  * @type {{ [key: string]: any; }}
    // Joi doesn't provide a way to validate this.
    // So, we punt by allowing anything.
    ext: Joi.any().optional(),

    /**
     * Issued at is an integer timestamp, measured in the number of seconds since January 1 1970 UTC, indicating when this token was originally issued.
     * @type {number}
     * @memberof IntrospectedOAuth2Token
     */
    iat: Joi.number().positive().optional(),

    /**
     * IssuerURL is a string representing the issuer of this token
     * @type {string}
     * @memberof IntrospectedOAuth2Token
     */
    iss: Joi.string().optional(),

    /**
     * NotBefore is an integer timestamp, measured in the number of seconds since January 1 1970 UTC, indicating when this token is not to be used before.
     * @type {number}
     * @memberof IntrospectedOAuth2Token
     */
    nbf: Joi.number().positive().optional(),

    /**
     * ObfuscatedSubject is set when the subject identifier algorithm was set to \"pairwise\" during authorization. It is the `sub` value of the ID Token that was issued.
     * @type {string}
     * @memberof IntrospectedOAuth2Token
     */
    obfuscated_subject: Joi.string().optional(),

    /**
     * Scope is a JSON string containing a space-separated list of scopes associated with this token.
     * @type {string}
     * @memberof IntrospectedOAuth2Token
     */

    // Note the definition does not specify the format
    // for individual scope names.  This REGEX allows
    // the scope string to be empty, and for scope names
    // to be upper/lower-case letters or numbers.

    scope: Joi.string().pattern(/[a-zA-Z0-9 ]*/).optional(),

    /**
     * Subject of the token, as defined in JWT [RFC7519]. Usually a machine-readable identifier of the resource owner who authorized this token.
     * @type {string}
     * @memberof IntrospectedOAuth2Token
     */
    sub: Joi.string().optional(),

    /**
     * TokenType is the introspected token\'s type, typically `Bearer`.
     * @type {string}
     * @memberof IntrospectedOAuth2Token
     */
    token_type: Joi.string().optional(),

    /**
     * TokenUse is the introspected token\'s use, for example `access_token` or `refresh_token`.
     * @type {string}
     * @memberof IntrospectedOAuth2Token
     */
    token_use: Joi.string().optional(),

    /**
     * Username is a human-readable identifier for the resource owner who authorized this token.
     * @type {string}
     * @memberof IntrospectedOAuth2Token
     */
    username: Joi.string().optional()
});

export function isOryIntrospectedOAuth2Token(data: any)
: {
    error?: ValidationError;
    value?: IntrospectedOAuth2Token
} {
    const { error, value } = joiOryIntrospectedOAuth2Token
    .validate(data, {
        allowUnknown: true
    });

    return { error, value };
}

export type AuthError = components["schemas"]["authError"];

// Copied from openadr-3-ts-types

export const joiAuthError = Joi.object({
    error: Joi.string()
        .allow(
            "invalid_request",
            "invalid_client",
            "invalid_grant",
            "invalid_scope",
            "unauthorized_client",
            "unsupported_grant_type"
        )
        .description(
            "As described in rfc6749 | invalid_request - The request is missing a parameter so the server can't proceed with the request. This may also be returned if the request includes an unsupported parameter or repeats a parameter. invalid_client - Client authentication failed, such as if the request contains an invalid client ID or secret. Send an HTTP 401 response in this case. invalid_grant - The authorization code (or user's password for the password grant type) is invalid or expired. This is also the error you would return if the redirect URL given in the authorization grant does not match the URL provided in this access token request. invalid_scope - For access token requests that include a scope (password or client_credentials grants), this error indicates an invalid scope value in the request. unauthorized_client - This client is not authorized to use the requested grant type. For example, if you restrict which applications can use the Implicit grant, you would return this error for the other apps. unsupported_grant_type - If a grant type is requested that the authorization server doesn't recognize, use this code. Note that unknown grant types also use this specific error code rather than using the invalid_request above."
        )
        .only()
        .required(),
    error_description: Joi.string()
        .allow("")
        .description(
            "Should be a sentence or two at most describing the circumstance of the error"
        )
        .min(0),
    error_uri: Joi.string()
        .description("Optional reference to more detailed error description")
        .uri({}),
    })
    .description(
        "error reponse on HTTP 400 from auth/token per https://www.rfc-editor.org/rfc/rfc6749"
    )
    .unknown();

export function isAuthError(data: any)
: {
    error?: ValidationError;
    value?: AuthError
} {
    const { error, value } = joiAuthError
    .validate(data, {
        allowUnknown: true
    });

    return { error, value };
}

