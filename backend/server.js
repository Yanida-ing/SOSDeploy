var express = require('./config/express');
var app = express();
var http = require('http');
var https = require('https');
var fs = require('fs');
var cfg = require('./config/config');

/**
 * Get port from environment and store in Express.
 */


var port = cfg.host.port;

// var options = {
//     key : fs.readFileSync('/etc/letsencrypt/live/finnext.io/privkey.pem'),
//     cert : fs.readFileSync('/etc/letsencrypt/live/finnext.io/fullchain.pem'),
    // passphrase : cfg.passphrase
// };

/**
 * Create HTTP server.
 */

var server = http.createServer(app);
// var server = https.createServer(options, app);

/* Maintain a hash of all connected sockets */
// var sockets = {}, nextSocketId = 0;
// server.on('connection', function (socket) {
//     /* Add a newly connected socket */
//     var socketId = nextSocketId++;
//     //sockets[socketId] = socket;
//     //console.log('socket', socketId, 'opened');
//     /* Remove the socket when it closes */
//     socket.on('close', function () {
//         //console.log('socket', socketId, 'closed');
//         delete sockets[socketId];
//     });
//
//     /* Extend socket lifetime for demo purposes */
//     socket.setTimeout(cfg.timeout);
// });

var io = require('socket.io')(server,{
    cors: {
        origin: "https://127.0.0.1",
        // methods: ["GET", "POST"],
        // allowedHeaders: ["my-custom-header"],
        credentials: true
    }})
require('./server/routes/socket.js')(io);



/**
 * Listen on provided port, on all network interfaces.
 */
//server.listen(port,hostip);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


// Graceful shutdown function
const shutdown = () => {
    console.log('Gracefully shutting down...');

    // Stop accepting new requests
    server.close(async () => {
        console.log('Closed all HTTP connections');

        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('Closed MongoDB connection');

        process.exit(0); // Exit process
    });

    // Force shutdown after 10 seconds if not finished
    setTimeout(() => {
        console.error('Forcing shutdown');
        process.exit(1); // Non-zero exit code for forced shutdown
    }, 10000);
};

// Listen for termination signals (e.g., from Docker, Kubernetes, or Ctrl+C)
server.on('SIGTERM', shutdown);
server.on('SIGINT', shutdown);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
}
