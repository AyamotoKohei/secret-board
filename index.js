'use strict';
const http = require('http');

const server = http.createServer((req, res) => {
    res.end('hi');
})
.on('error', e => {
    console.error('ServerError', e);
})
.on('clientError', e => {
    console.error('Client Error', e);
});

const port = 8000;
server.listen(port, () => {
    console.info(`Listening on ${port}`);
});
