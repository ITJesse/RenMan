var http = require('http');
var soap = require('./soap');
var async = require('async');
var parseString = require('xml2js').parseString;
var mysql = require('./mysql');

var tryParseJSON = function (jsonString){
    try {
        var o = JSON.parse(jsonString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns 'null', and typeof null === "object",
        // so we must check for that, too.
        if (o && typeof o === "object" && o !== null) {
            return o;
        }
    }
    catch (e) { }

    return false;
};

var myService = {
    ESBInterfaceServiceService: {
        ESBInterfaceServicesPort: {
            esbInterfaceService: function (data, callback) {
                console.log(data);
                var task = [];
                async.waterfall([
                    // function(cb){
                    //     var data = tryParseJSON(arg);
                    //     console.log(data);
                    //     if(data){
                    //         cb(null, data);
                    //     }else{
                    //         cb('wrong data');
                    //     }
                    // }, //判断是否为json
                    function(cb){
                        parseString(data.esbHeader, function (err, result) {
                            if(err){
                                cb(err);
                            }else{
                                cb(null, result, data.payload);
                            }
                        });
                    }, //解析XML
                    function(esbHeader, payload, cb){
                        // console.log(esbHeader);
                        if(esbHeader.esbHeader.serviceName != "getOut1002" || !esbHeader.esbHeader.requestId){
                            cb('wrong data');
                        }else{
                            var sql = "INSERT INTO esb_log (requestId) VALUES ('"+esbHeader.esbHeader.requestId[0]+"')";
                            mysql.query(sql, function(err) {
                                if(err){
                                    cb(err);
                                }else{
                                    cb(null, payload);
                                }
                            });
                        }
                    }, //判断是否为正常的esb报文并记录
                    // function(payload, cb){
                    //     var data = tryParseJSON(payload);
                    //     if(data){
                    //         cb(null, data);
                    //     }else{
                    //         cb('wrong data');
                    //     }
                    // }, //判断是否为json
                    function(data, cb){
                        var id = JSON.parse(data);
                        for(var i in id){
            				(function(x){
            					task.push(function(cb2){
            						mysql.query("SELECT order_id, state_code FROM ticket WHERE order_id = '"+id[i]+"'", function(err, rows){
            							if(err){
            								cb2(err);
            							}else{
            								cb2(null, rows);
            							}
            						});
            					});
            				})(i);
            			}
                        cb(null, task);
                    }, //建立查询任务数组
                    function(task, cb){
                        async.parallel(task, function(err, result){
            				if(err) return cb(err);
            				cb(null, result);
            			});
                    } //并行查询所有记录
                ], function(err, result) {
                    var json = {};
                    if(err == 'wrong data'){
                        json.errorCode = '1';
                        json.errorDesc = '参数错误';
                    }
                    else if(err){
                        console.log(err);
                        json.errorCode = '1';
                        json.errorDesc = '内部错误';
                    }
                    else{
                        json.errorCode = '000000';
                        json.errorDesc = [];
                        for(var i in result){
                            // console.log(result[i]);
                            // if(result[i].order_id){
                                var item = {
                                    id: '111',//result[i].order_id,
                                    status: '222'//result[i].state_code
                                };
                                json.errorDesc.push(item);
                            // }
                        }
                    }
                    console.log(json);
                    callback('<result>' + JSON.stringify(json) + '</result>');
                });
            }
        }
    }
}

var xml = require('fs').readFileSync('JAVAESBService.wsdl', 'utf8');
var server = http.createServer(function(request,response) {
    response.end("404: Not Found: "+request.url);
});

server.listen(8000);

// server.log = function(type, data) {
//   console.log(data);
// };

soap.listen(server, '/wsdl', myService, xml);
