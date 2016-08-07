"use strict";
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var path = require('path');
function startServer() {
    return new Promise(function (resolve) {
        var app = express();
        console.log(__dirname);
        app.use(express.static(path.join(__dirname, '..', '..', 'public')));
        // app.use(morgan('dev'));
        // app.use(morgan('common'));
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.get('/test', function (req, res) {
            res.send(['Hello', 'world']);
        });
        var server = http.createServer(app);
        server.listen(0, function () {
            console.log("Server listening on port " + server.address().port);
            console.log(server.address().port);
            resolve(server.address().port);
        });
    });
}
exports.startServer = startServer;
//# sourceMappingURL=app.js.map