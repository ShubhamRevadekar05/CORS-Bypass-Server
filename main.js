const { createServer, request: httpRequest } = require("node:http");
const { request: httpsRequest } = require("node:https");
const { getBody } = require("./utils/getBody");

const server = createServer((req, res) => {
    (async () => {
        if (req.method === "OPTIONS") {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "*");
            res.setHeader("Access-Control-Allow-Headers", "*");
            return res.end();
        }
        
        try {
            var ENDURL = new URL(process.env.ENDURL);
            if (!ENDURL.host) throw Error("HOST is blank");
        }
        catch(err) {
            console.log("ENDURL Parse Error:", err);
            res.writeHead(500, {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*"
            });
            return res.end(JSON.stringify({ message: "Error while parsing EndURL!" }));
        }
        let headers = req.headers;
        if (headers["host"]) headers["host"] = ENDURL.host;
        if (headers["hostname"]) headers["hostname"] = ENDURL.host;
        let bounceRequest = (ENDURL.protocol === "http:" ? httpRequest : httpsRequest)({
            host: ENDURL.hostname,
            port: (ENDURL.port || (ENDURL.protocol === "http:" ? 80: 443)),
            path: ENDURL.pathname.slice(1) + req.url,
            method: req.method,
            headers: req.headers
        }, bounceResponse => {
            (async () => {
                console.log(`INFO: ${req.method} - ${req.url} - ${bounceResponse.statusCode}`);
                res.writeHead(bounceResponse.statusCode, {
                    ...bounceResponse.headers,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*"
                });
                res.write(await getBody(bounceResponse));
                res.end();
            })();
        });
        bounceRequest.on("error", (err) => {
            console.error("ERROR:", err);
            res.end();
        });
        bounceRequest.write(await getBody(req));
        bounceRequest.end();
    })();
});

server.listen(process.env.PORT, () => {
    console.log(`Server running at: http://${(address => address === "::" || address === "0.0.0.0" ? "localhost" : address)(server.address().address)}:${server.address().port}/`);
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
