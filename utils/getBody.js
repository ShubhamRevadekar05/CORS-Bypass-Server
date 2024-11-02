exports.getBody = (req) => {
    return new Promise((resolve, reject) => {
        try {
            let buffer = []
            req.on("data", chunk => {
                buffer.push(chunk);
            });
            req.on("end", () => {
                resolve(Buffer.concat(buffer));
            });
        }
        catch (error) {
            console.error(error);
            reject(error);
        }
    });
};
