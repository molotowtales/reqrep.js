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

        // I haven't read up on exactly what monitor does, but if it actually opens the connection, 
        // it should be moved to setup. 
        this.socket.monitor(10, 0);

        // The reason I've moved the connection part out of the constructor is that it's bad design
        // to mix a side-effect (opening a connection) with the creation of an object. That prevents
        // any user of the module from for example making a req-rep object, confuigure it and then 
        // pass it on to something asynchronous for later execution
        // It's better to explicitly make the user of the module open the connection when they're good and ready!
    }

    setup(){
        this.socket.connect(this.port);

        // There's no reason to construct an explicit promise-object and then return it, since
        // there's no change in semantics with returning the promise straight away. That also
        // prevents any mistakes resulting from copying/pasting which would change the order of 
        // callbacks attached to the promise. 

        // If the module itself needs to add callbacks to the promise when it resolves, then just
        // add them and return a promise from the #then-callback straight away, as recommended by A+. 
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