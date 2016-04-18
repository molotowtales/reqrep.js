"use strict"; 
var zmq              = require('zmq');
var Promise          = require("bluebird");

const TYPE_READY     = "\x01";
const TYPE_HEARTBEAT = "\x02";
const TYPE_REQUEST   = "\x03";
const TYPE_RESPONSE  = "\x04";
const TYPE_ERROR     = "\x05";

class ReqRepp{

    constructor(port, options, tracking_id, method, message){
        this.port = port;
        this.options = options;

        this.socket = zmq.socket('req');
        this.socket.identity = 'pid:' + process.pid;
        this.socket.monitor(10, 0);

    }

    setup(){
        this.socket.connect(port);
        return new Promise((resolve, reject) => {
            this.socket.on('connect', (fd, ep) => {
                resolve(this);
            });
        });
    }

    send(tracking_id, method, message){        
        this.socket.send([TYPE_REQUEST, tracking_id, method, message]);

        return new Promise((resolve, reject) => {
            this.socket.on('message', function(type, tracking_id, data) {
                if (type.toString() == TYPE_RESPONSE) {
                    resolve(data);
                } else {
                    reject(new Error("Incorrect response received."));
                }
            });
        });
    }

}

module.exports = ReqRepp;