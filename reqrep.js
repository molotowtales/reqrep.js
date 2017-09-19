"use strict";
var zmq     = require('zmq');
var Promise = require('bluebird');
var _       = require('underscore');

const MessageTypes = {
  TYPE_READY:     "\x01",
  TYPE_HEARTBEAT: "\x02",
  TYPE_REQUEST:   "\x03",
  TYPE_RESPONSE:  "\x04",
  TYPE_ERROR:     "\x05"
}


function ProcessingError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
};
require('util').inherits(ProcessingError, Error);

class Client {

    constructor(port, options) {
        var self = this;

        this.port = port;
        this.options = _.extend({
            connect_timeout: 1000,
            receive_timeout: 1000
        }, options);

        this.socket = zmq.socket('req');
        this.connceted = false;
        //this.socket.identity = 'pid:' + process.pid;

        this.responses = [];

        this.socket.on('error', function(err) {
            var { resolve, reject } = self.responses.shift();

            reject(err);
        });

        this.socket.on('message', function(type, tracking_id, data) {
            var { resolve, reject } = self.responses.shift();

            if (type.toString() == MessageTypes.TYPE_RESPONSE) {
                resolve(data);
            } else {
                reject(data);
            }
            self.disconnect();
        });
    }

    connect() {
        this.socket.connect(this.port);
        this.connceted = true;

        return new Promise((resolve, reject) => {
            resolve(this);
        });

        /*this.socket.monitor(10, 0);

        this.socket.connect(this.port);

        return new Promise((resolve, reject) => {
            this.socket.on('connect', (fd, ep) => {
                resolve(this);
            });
        }).timeout(this.options.connect_timeout, 'connect timeout');*/
    }

    disconnect() {
        if (this.connceted) {
            this.connceted = false;
            this.socket.disconnect(this.port);
            this.socket.close();

            return new Promise((resolve, reject) => {
                this.socket.on('disconnect', (fd, ep) => {
                    resolve(this);
                });
            });
        }
    }

    send(tracking_id, method, message) {
        this.socket.send([MessageTypes.TYPE_REQUEST, tracking_id, method, message]);

        return new Promise((resolve, reject) => {
            this.responses.push({
                resolve: resolve,
                reject: reject
            });
        }).timeout(this.options.receive_timeout, 'receive timeout');
    }
}

class Server {

    constructor(server_endpoint, options) {
        var self = this;

        this.options = _.extend({
            workers: 10,
        }, options);

        this.server_endpoint = server_endpoint;
        this.worker_endpoint = 'inproc://workers';

        this.router = zmq.socket('router');
        //this.router.identity = 'router';

        this.dealer = zmq.socket('dealer');
        //this.dealer.identity = 'dealer';

        this.workers = [];
    }

    run(callback) {
        var self = this;

        this.router.bind(this.server_endpoint, function(err) {
            if (err) throw err;
            //console.log('router bound!');

            self.router.on('message', function() {
                //console.log(self.router.identity + ': received');
                self.dealer.send(Array.prototype.slice.call(arguments));
            });
        });

        this.dealer.bind(this.worker_endpoint, function(err) {
            if (err) throw err;
            //console.log('dealer bound!');

            self.dealer.on('message', function() {
                //console.log(self.dealer.identity + ': received');
                self.router.send(Array.prototype.slice.call(arguments));
            });
        });

        for (var i = 0; i < this.options.workers; i++) {
            //console.log('setup worker#' + i);
            var worker = zmq.socket('rep');
            //worker.identity = 'worker:' + i;

            worker.on('message', function(message_type, tracking_id, method, data) {
                callback.apply(this, [tracking_id, method, data]).then((result) => {
                    this.send([MessageTypes.TYPE_RESPONSE, tracking_id, result]);
                }).catch((err) => {
                    if (err instanceof ProcessingError) {
                        this.send([MessageTypes.TYPE_ERROR, tracking_id, err.message]);
                    } else {
                        this.send([MessageTypes.TYPE_ERROR, tracking_id, 'An internal service error occurred: [' + err.name + ': ' + err.message + ']']);
                    }
                });
            });
            worker.connect(this.worker_endpoint);

            this.workers.push(worker);
        }
    }
}

module.exports = {
    MessageTypes: MessageTypes,
    ProcessingError: ProcessingError,
    Client: Client,
    Server: Server
}
