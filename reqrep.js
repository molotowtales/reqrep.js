"use strict"; 
var zmq              = require('zmq');
var Promise          = require('bluebird');
var _                = require('underscore');

const TYPE_READY     = "\x01";
const TYPE_HEARTBEAT = "\x02";
const TYPE_REQUEST   = "\x03";
const TYPE_RESPONSE  = "\x04";
const TYPE_ERROR     = "\x05";

class ReqRep {

    constructor(port, options) {
        var self = this;

        this.port = port;
        this.options = _.extend({
            connect_timeout: 1000,
            receive_timeout: 1000
        }, options);

        this.socket = zmq.socket('req');
        this.socket.identity = 'pid:' + process.pid;

        this.responses = [];

        this.socket.on('error', function(err) {
            var { resolve, reject} = self.responses.shift();

            reject(err);
        });

        this.socket.on('message', function(type, tracking_id, data) {
            var { resolve, reject} = self.responses.shift();

            if (type.toString() == TYPE_RESPONSE) {
                resolve(data);
            } else {
                reject(data);
            }
        });
    }

    connect() {
        this.socket.monitor(10, 0);

        this.socket.connect(this.port);

        return new Promise((resolve, reject) => {
            this.socket.on('connect', (fd, ep) => {
                resolve(this);
            });
        }).timeout(this.options.connect_timeout, 'connect timeout');
    }

    disconnect() {
        this.socket.disconnect(this.port);

        return new Promise((resolve, reject) => {
            this.socket.on('disconnect', (fd, ep) => {
                resolve(this);
            });
        });
    }

    send(tracking_id, method, message) {
        this.socket.send([TYPE_REQUEST, tracking_id, method, message]);

        return new Promise((resolve, reject) => {
            this.responses.push({
                resolve: resolve,
                reject: reject
            });
        }).timeout(this.options.receive_timeout, 'receive timeout');
    }
}

module.exports = ReqRep;