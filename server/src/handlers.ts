
import util from 'node:util';
import type { Context } from "openapi-backend";
import { Request, Response } from "express";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc.js';
import { isEchoThing, reportProblem } from './types.js';
import { logger } from './app.js';
dayjs.extend(utc);

export async function getDate(
    c: Context, req: Request, res: Response
) {
    return res.status(200).json({
        date: dayjs.utc().toDate()
    });
}

export async function echoHandler(
    c: Context, req: Request, res: Response
) {
    // logger.info(util.inspect(c?.request?.body));
    const valid = isEchoThing(c?.request?.body);
    // logger.info(util.inspect(valid));
    if (!valid || valid.error) {
        return res.status(400).json(reportProblem(
            `Bad echoThing -- ${util.inspect(c?.request?.body)} -- ${util.inspect(valid.error)}`,
            400
        ));
    }
    if (!valid.value) {
        return res.status(400).json(reportProblem(
            `No echoThing -- ${util.inspect(c?.request?.body)} -- No error given, but no value ${util.inspect(valid.value)}`,
            400
        ));
    }
    return res.status(200).json(valid.value);
}
