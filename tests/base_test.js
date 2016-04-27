"use strict";
var ReqRep		= require('./../reqrep');
var protobufjs	= require('protobufjs');
var assert		= require('assert');
var zmq			= require('zmq');

describe("ReqRep with Divide Service", function() {
	before(function() {
		this.pb_divide_service = protobufjs.loadProtoFile(__dirname + '/divide_service.proto').build('divide_service');

		this.port = 'tcp://127.0.0.1:56123';

		// setup reqrep-server
		this.rep = zmq.socket('rep');

		this.rep.on('message', (type, tracking_id, method, message) => {
			if (type.toString() == "\x03" && method.toString() == 'divide') {
				var request = this.pb_divide_service.Divide.decode(message);
				var reply = new this.pb_divide_service.DivideResponse({
					'result': request.num1 / request.num2
				}).encode().toBuffer();
				this.rep.send(["\x04", tracking_id, reply]);
			}
		});

		this.rep.bind(this.port, (err) => {
			if (err) throw err;
		});
	});

	it('should be able to divide', function(done) {
		var relation_service = new ReqRep(this.port, {}).connect().then((req) => {
			var message = new this.pb_divide_service.Divide({
				'num1': 10,
				'num2': 2
			}).encode().toBuffer();
			req.send('123', 'divide', message).then((data) => {
				var response = this.pb_divide_service.DivideResponse.decode(data);
				assert.equal(response.result, 5);
				done();
			}).catch(done);
		}).catch(done);
	});

});