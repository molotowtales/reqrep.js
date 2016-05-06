"use strict";
var ReqRep		= require('./../reqrep');
var protobufjs	= require('protobufjs');
var Promise		= require('bluebird');
var path 		= require('path');

var port = 'tcp://127.0.0.1:56789';

class Service {
	constructor() {
		this.pb = protobufjs.loadProtoFile(path.join(__dirname, 'calc_service.proto')).build('calc_service');
	}

	_add(pb_request) {
		var self = this;
		return new Promise((resolve, reject) => {
			var request = self.pb.Add.decode(pb_request);
			var result = request.num1 + request.num2;

			if (result == 42) {
				reject(new ReqRep.ProcessingError(new self.pb.AddError({type: 1, message: '...'}).encode().toBuffer()));
			}
			if (result == 43) {
				reject(new ReqRep.ProcessingError(new self.pb.AddError({type: 0, message: 'Wrong question!'}).encode().toBuffer()));
			}
			if (result == 44) {
				// will break things
				8+o;
			}

			resolve(new self.pb.AddResponse({
				'result': result
			}).encode().toBuffer());
		});
	}
}

function callback(tracking_id, method, request){
	return service['_' + method.toString()](request);
}

var service = new Service();
var server = new ReqRep.Server(port, {workers: 30}).run(callback);
