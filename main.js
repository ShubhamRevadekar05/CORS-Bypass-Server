const { createServer } = require("node:http");
const { request } = require("node:https");
const { getBody } = require("./utils/getBody");

const server = createServer((req, res) => {
    (async () => {
        if (req.method === "OPTIONS") {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "*");
            res.setHeader("Access-Control-Allow-Headers", "*");
            return res.end();
        }
        let headers = req.headers;
        if (headers["host"]) headers["host"] = process.env.ENDHOST;
        if (headers["hostname"]) headers["hostname"] = process.env.ENDHOST;
        let httpRequest = request({
            host: process.env.ENDHOST,
            path: req.url,
            method: req.method,
            headers: req.headers
        }, httpResponse => {
            (async () => {
                console.log(`INFO: ${req.method} - ${req.url} - ${httpResponse.statusCode}`);
                res.writeHead(httpResponse.statusCode, {
                    ...httpResponse.headers,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*"
                });
                res.write(await getBody(httpResponse));
                res.end();
            })();
        });
        httpRequest.on("error", (err) => {
            console.error("ERROR:", err);
            res.end();
        });
        httpRequest.write(await getBody(req));
        httpRequest.end();
    })();
});

server.listen(process.env.PORT, () => {
    console.log(`Server running at: http://${process.env.HOST}:${process.env.PORT}/`);
});

const shutdown = () => {
    console.log('Shutting down...');
    server.close((err) => {
        if (err) {
            console.error('Error during shutdown:', err);
        }
        console.log('Server closed. Exiting process.');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('Forcing shutdown...');
        process.exit(1);
    }, 2000);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
