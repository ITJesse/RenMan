var soap = require('soap');
var url = 'http://localhost:8000/wsdl?wsdl';
var args = {
    esbHeader: '<esbHeader><requestId>550e8400-e29b-41d4-a716-446655440000</requestId><serviceName>getOut1002</serviceName><serviceVersion></serviceVersion><key>f15f044f-dce7-4486-9261-c219cb0517f3</key><requester>EIP</requester><receiver>BJZB</receiver></esbHeader>',
    payload: '["9772759898703","784-2168991189"]'
};

soap.createClient(url, function(err, client) {
    // console.log(client.describe().ESBInterfaceServiceService.ESBInterfaceServicesPort.esbInterfaceService);
    client.ESBInterfaceServiceService.ESBInterfaceServicesPort.esbInterfaceService(args, function(err, result) {
        console.log(result);
        console.log(client.lastRequest);
    });
});
