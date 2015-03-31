var http = require('http');
var soap = require('soap');
var mysql = require('mysql');

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
            esbInterfaceService: function (arg) {
                console.log(arg);
                var task = [];
                async.waterfall([
                    function(cb){
                        var data = tryParseJSON(arg);
                        if(data){
                            cb(null, data);
                        }else{
                            cb('wrong data');
                        }
                    }, //判断是否为json
                    function(data, cb){
                        if(data.esbHeader.serviceName == "getOut1002" && data.esbHeader.key == "KHJK&*^(KJHJL)" && data.esbHeader.requestId){
                            cb('wrong data');
                        }else{
                            var sql = "INSERT INTO esb_log (requestId) VALUES ('"+data.esbHeader.requestId+"')";
                            mysql.query(sql, function(err) {
                                if(err){
                                    cb(err);
                                }else{
                                    cb(null, data.payload);
                                }
                            });
                        }
                    }, //判断是否为正常的esb报文并记录
                    function(data, cb){
                        for(var i in data){
            				//console.log(list[i]);
            				(function(x){
            					task.push(function(cb2){
            						console.log(list[x]);
            						mysql.query("SELECT order_id, state_code FROM ticket WHERE order_id = '"+data[i].orderNo+"'", function(err, rows){
            							if(err){
            								cb2(err);
            							}else{
            								cb2(null, rows[0]);
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
                ], function(cb, result) {
                    var json = {};
                    if(err == 'wrong data'){
                        json.errorCode = 1;
                        json.errorDesc = '参数错误';
                    }
                    else if(err){
                        json.errorCode = 1;
                        json.errorDesc = '内部错误';
                    }
                    else{
                        json.errorCode = 2;
                        json.errorDesc = [];
                        for(var i in result){
                            json.message.push(result[i][0]);;
                        }
                    }
                    return JSON.stringify(json);
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

server.log = function(type, data) {
  console.log(data);
};

soap.listen(server, '/wsdl', myService, xml);
