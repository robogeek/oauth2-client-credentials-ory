
import { OpenAPIBackend } from 'openapi-backend';
import type { Context, Request } from 'openapi-backend';
import { default as addFormats } from 'ajv-formats';
import { Express, RequestHandler, Response } from 'express';

import YAML from 'js-yaml';
import util from 'node:util';
import * as path from 'path';
import { __dirname, logger } from './app.js';

import {
    echoHandler, getDate
} from './handlers.js';
import { fetchToken, oath2ClientHandler } from './auth.js';
import { reportProblem } from './types.js';


export default async function setupAPI(mount: string, app: Express) {

    const api = new OpenAPIBackend({ 
        definition: path.join(
            __dirname, '..', '..', 'spec', 'spec.yml'),
        strict: false,
        customizeAjv: (ajv) => {
            addFormats.default(ajv, { mode: 'fast', formats: ['email', 'uri', 'date-time', 'uuid'] });
            return ajv;
        },
    });
    
    api.register({
        echoHandler, getDate, fetchToken
    });

    app.use(mount, (req, res) => api.handleRequest(req as Request, req, res));

    api.register("notFound", APIHandlerNotFound);
    api.register("methodNotAllowed", APIMethodNotAllowed);
    api.register("notImplemented", APINotImplementedHandler);

    api.registerSecurityHandler(
        "oAuth2ClientCredentials",
        oath2ClientHandler);

    // api.registerSecurityHandler(
    //         "bearerAuth",
    //         bearerAuthHandler);

    api.register("unauthorizedHandler", (c, req, res) => {
        // return res.status(401).json({ err: "unauthorized" });
        logger.info(YAML.dump({
            title: 'unauthorizedHandler',
            opMethod: c?.operation?.method,
            opId: c?.operation?.operationId,
            method: c?.request.method,
            path: c?.request.path,
            params: c?.request.params,
            query: c?.request.query,
            headers: c?.request.headers,
            requestBody: c?.request.body,
            security: util.inspect(c?.security)
        }, { indent: 4 }));
        return res.status(403).json(reportProblem("unauthorized", 403));
    });

}

export function APIHandlerNotFound(c: Context, req: RequestHandler, res: Response) {
    const msg = `APIHandlerNotFound Request handler not found for ${c?.request?.method} ${c?.request?.path}`;
    logger.error(msg);
    return res.status(404).json(reportProblem(msg, 404));
}

export function APIMethodNotAllowed(c: Context, req: Request, res: Response) {
    const msg = `APIMethodNotAllowed Method not allowed for ${c?.operation?.operationId} ${c?.request?.method} ${c?.request?.path}`;
    logger.error(msg);
    return res.status(405).json(reportProblem(msg, 405));
}

export function APINotImplementedHandler(c: Context, req: Request, res: Response) {
    const msg = `APINotImplementedHandler No handler registered for operation ${c?.operation?.operationId} ${c?.request?.method} ${c.request.path}`;
    logger.error(msg);
    return res
        .status(501)
        .json(reportProblem(msg, 501));
}
