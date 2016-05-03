var ReqRep		= require('./../reqrep');
var zmq			= require('zmq');
var _			= require('underscore');
var protobufjs	= require('protobufjs');
var path 		= require('path');

var port = 'tcp://127.0.0.1:56789';

var pb = protobufjs.loadProtoFile(path.join(__dirname, 'calc_service.proto')).build('calc_service');
for (var ei = 0; ei < 1; ei++) {
	var service = new ReqRep.Client(port, {}).connect().then(
		function(service) {
			for (var i = 0; i < 10; i++) {
				var message = new pb.Add({
					'num1': 19 + i,
					'num2': 21
				}).encode().toBuffer();

				service.send('tracking_id', 'add', message).then(
					function(data) {
						console.log(pb.AddResponse.decode(data));
					}).catch(function(err) {
						try {
							console.log('err', pb.AddError.decode(err));
						} catch (decode_error) {
							console.log(new Error('Server internal: ' + err.toString()));
						}
				});
			}
		}).catch(function(err) {
		throw new Error('Could not connect to account_service');
	});
}
