var zmq              = require('zmq');
var Promise          = require("bluebird");

const TYPE_READY     = "\x01";
const TYPE_HEARTBEAT = "\x02";
const TYPE_REQUEST   = "\x03";
const TYPE_RESPONSE  = "\x04";
const TYPE_ERROR     = "\x05";

var ReqRep = function(port, options, tracking_id, method, message) {
    // @buffpojken: better way than using self?
    const self = this;
    self.port = port;
    self.options = options;

    self.socket = zmq.socket('req');
    self.socket.identity = 'pid:' + process.pid;
    self.socket.monitor(10, 0);

    var promise = new Promise.bind(self, function(resolve, reject) {
        self.socket.on('connect', function(fd, ep) {
            resolve(self);
        });
    });
    self.socket.connect(port);

    return promise;
};

ReqRep.prototype.send = function(tracking_id, method, message) {
    const self = this;

    var promise = new Promise(function(resolve, reject) {
        self.socket.on('message', function(type, tracking_id, data) {
            if (type.toString() == TYPE_RESPONSE) {
                resolve(data);
            } else {
                reject(data);
            }
        });
    });

    self.socket.send([TYPE_REQUEST, tracking_id, method, message]);
    return promise;
};

module.exports = ReqRep;
