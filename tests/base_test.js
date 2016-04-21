"use strict";
const ReqRep		= require('./../reqrep');
const protobufjs	= require("protobufjs");
const assert		= require("assert");
const zmq			= require('zmq');


describe("ReqRep with Relation Service", function() {

	before(function() {
		this.pb_relation_service = protobufjs.loadProtoFile("protobuf_formats/relation_service/relation_service.proto").build('relation_service');
	});

	it('should load relations', function(done) {
		var pb_relation_service = this.pb_relation_service;
		var relation_service = new ReqRep('tcp://accounts.test.lin.education:52003', {}).connect().then(function(req) {
			var message = new pb_relation_service.ReadUserRoleByUserUUID({
				'user_uuid': '4548f758-ab78-11e3-bf6b-080027bf0f5d'
			}).encode().toBuffer();
			req.send('123', 'read_user_role_by_user_uuid', message).then(
				function(data) {
					done();
				}).catch(done);
		}).catch(done)
	});

});