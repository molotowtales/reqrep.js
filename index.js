var ReqRep     = require('./reqrep');

var protobufjs = require("protobufjs");
var node_rsa   = require('node-rsa');
var fs         = require('fs');

/*// protobuf-stuff
var builder = protobufjs.loadProtoFile("protobuf_formats/user_service/user_service.proto");
var pb_user_service = builder.build('user_service');

// key-stuff
var keyData = fs.readFileSync('dev.pem');
var key = new node_rsa();
key.importKey(keyData, 'pkcs1');

// connect!
var user_service = new ReqRep('tcp://127.0.0.1:52002', {}).then(
    function(){
        console.log('conn ok!');

        var message = key.encrypt(new pb_user_service.Authenticate({
            'email': 'slask@slask.se',
            'password': '123'
        }).encode().toBuffer());

        // send message
        this.send('123', 'authenticate', message).then(
            function(data){
                // decode response
                console.log('ok!', pb_user_service.AuthenticationResponse.decode(data));
            },
            function(data){
                // decode error
                console.log('err', pb_user_service.AuthenticationError.decode(data));
            });
    },
    function(){
        console.log('conn err');
    });*/



var pb_relation_service = protobufjs.loadProtoFile("protobuf_formats/relation_service/relation_service.proto").build('relation_service');

var relation_service = new ReqRep('tcp://127.0.0.1:52003', {}).then(
    function(){
        var message = new pb_relation_service.ReadUserRoleByUserUUID({
            'user_uuid': '4548f758-ab78-11e3-bf6b-080027bf0f5d'
        }).encode().toBuffer();

        this.send('123', 'read_user_role_by_user_uuid', message).then(
            function(data){
                console.log('ok!', pb_relation_service.ReadUserRoleResponse.decode(data));
            },
            function(data){
                console.log('err', pb_relation_service.ReadUserRoleError.decode(data));
            });
    },
    function(){
    });
