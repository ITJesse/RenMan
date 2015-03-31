var soap = require('soap');
var url = 'http://localhost:8000/wsdl?wsdl';
var args = {
    esbHeader: JSON.stringify({
        requestId: '123',
        serviceName: 'abc',
        serviceOperation: null,
        serviceVersion: null,
        key: 'KHJK&*^(KJHJL)'
    }),
    payload: JSON.stringify({
        a: '1',
        b: '2',
        c: '3'
    })
};

soap.createClient(url, function(err, client) {
    // console.log(client.describe().ESBInterfaceServiceService.ESBInterfaceServicesPort.esbInterfaceService);
    client.ESBInterfaceServiceService.ESBInterfaceServicesPort.esbInterfaceService(args, function(err, result) {
        console.log(result);
    });
});
