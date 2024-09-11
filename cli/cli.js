
import path from 'node:path';
import util from 'node:util';
import { program } from 'commander';
import got from 'got';


program
    .name('auth-cli')
    .description('Sample client for OAuth2 server')
    .version('0.1.0');

// Create client
// Delete client
// Introspect
// ?? Delete token
//
// Invoke ECHO
// Invoke DATE


program.option('-s, --server <url>', 'specify URL for ESX server');

function server() {
    const opts = program.opts();
    for (const key in opts) {
        if (key === 'server') {
            const _url = opts[key];
            return new URL(_url);
        }
    }
    throw new Error(`server could not generate URL ${util.inspect(opts)}`);
}

program.option('--authToken <authToken>',
    'Authorization token');

function authToken() {
    const opts = program.opts();
    for (const key in opts) {
        if (key === 'authToken') {
            return opts[key];
        }
    }
}  

program
    .command('fetch-token')
    .description('Invoke /auth/token to fetch a token')
    .option('--clientID <clientID>', 'Client access token string')
    .option('--clientSecret <clientSecret>', 'Client access secret token string')
    .option('--scope <scope>', 'Client access  scope')
    .action(async (options, command) => {

        const esx = server();
        esx.pathname = path.join('api', 'auth', 'token');

        let clientID;
        if ('clientID' in options
         && typeof options.clientID !== 'undefined') {
            clientID = options.clientID;
        }

        let clientSecret;
        if ('clientSecret' in options
         && typeof options.clientSecret !== 'undefined') {
            clientSecret = options.clientSecret;
        }

        let scope;
        if ('scope' in options
         && typeof options.scope !== 'undefined') {
            scope = options.scope;
        }

        const ccrequest = {
            grant_type: "client_credentials",
            client_id: clientID,
            client_secret: clientSecret,
            scope: scope
        };

        let res;
        try {
            res = await got.post(
                esx.href,
                { json: ccrequest }
            );

            if (res.statusCode !== 200) {
                console.log(`ERROR ${res.statusCode} ${res.statusMessage} ${res.url} ${res.method} ${util.inspect(res.headers)}`, JSON.parse(res.body).title);
            } else {
                console.log(JSON.parse(res.body));
            }
    
        } catch (err) {
            console.log(`fetch-token FAIL ${err?.code} ${err?.response?.statusCode} ${err?.response?.statusMessage} ${err?.message} ${err?.response?.requestUrl} ${err?.response?.body}`);
        }

    });

program
    .command('get-date')
    .description('Get the Date')
    .action(async (options, command) => {
        const token = authToken();
        const headers = token
            ? {
                Authorization: `Bearer ${token}`
            } : undefined;
        const service = server();
        service.pathname = path.join('api', 'date');

        try {
            const resp = await got(service.href, {
                headers
            });
            const date = JSON.parse(resp.body);
            console.log(date);
        } catch (err) {
            console.error(`date FAIL ${err?.code} ${err?.response?.statusCode} ${err?.response?.statusMessage} ${err?.message} ${err?.response?.requestUrl} ${err?.response?.body}`);
        }
    });

program
    .command('echo')
    .description('Echo .. ho ... o')
    .option('--title <title>', 'Title to echo')
    .option('--body <body>', 'Body to echo')
    .action(async (options, command) => {
        const token = authToken();
        const headers = token
            ? {
                Authorization: `Bearer ${token}`
            } : undefined;
        const service = server();
        service.pathname = path.join('api', 'echo');

        let title;
        if ('title' in options
         && typeof options.title !== 'undefined') {
            title = options.title;
        }

        let body;
        if ('body' in options
         && typeof options.body !== 'undefined') {
            body = options.body;
        }

        const echo = {
            title, body
        };

        if (typeof echo.title !== 'string'
         || typeof echo.body !== 'string'
        ) {
            throw new Error(`No title or no body in arguments`);
        }

        try {
            const resp = await got.post(service.href, {
                headers,
                json: echo
            });
            const echoed = JSON.parse(resp.body);
            console.log(util.inspect(echoed));
        } catch (err) {
            console.error(`echo FAIL ${err?.code} ${err?.response?.statusCode} ${err?.response?.statusMessage} ${err?.message} ${err?.response?.requestUrl} ${err?.response?.body}`);
        }
    });

process.on('unhandledRejection', (reason, promise) => {
    console.error(`CLI unhandledRejection ${util.inspect(reason)} ${util.inspect(promise)}`);
});

process.on('warning', (warning) => {
    console.warn(`CLI NODE PROCESS WARNING ${util.inspect(warning)}`);
});
    
program.parse(process.argv);
