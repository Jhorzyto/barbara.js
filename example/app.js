var app = angular.module('App-Example', ['Barbara-Js']);

app.service("AppService", function($request){

    this.getData = function(data, success, error){
        $request.get('http://localhost/rest.php')
                .addData(data)
                .addCallback(501, error)
                .send(success);
    };

    this.getData2 = function(data, success, error){
        $request.delete('http://localhost/rest.php')
                .addData(data)
                .addCallback(401, function(){
                    console.log("teste");
                })
                .send(success, error);
    };
});

app.controller('AppController', function($scope, AppService, bootstrap) {

    $scope.alert = bootstrap.alert();

    AppService.getData({bla: 'bla'}, function(a,b,c){
        $scope.data = {a: a, b: b, c: c };
        $scope.alert.responseSuccess('Você recebeu os dados com successo!');
    }, function(data){
        $scope.alert.responseError(data);
        console.log(data);
    });

    AppService.getData2({bla1: 'bla2'}, function(data){
        console.debug(data);
    }, function(data){
        console.log(data);
    });
});