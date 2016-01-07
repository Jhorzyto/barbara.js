//Iniciando o modulo Barbara-JS
var barbaraJs = angular.module('Barbara-Js', []);

//Configurações para CORS
barbaraJs.config(function ($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

//Inicializador do barbaraJs
barbaraJs.run(function(){
    //Animação para icone de carregamento
    //CSS não minificado
    //
    //.glyphicon.spinning {
    //    animation: spin 1s infinite linear;
    //    -webkit-animation: spin2 1s infinite linear;
    //}
    //
    //@keyframes spin {
    //    from { transform: scale(1) rotate(0deg); }
    //    to { transform: scale(1) rotate(360deg); }
    //}
    //
    //@-webkit-keyframes spin2 {
    //    from { -webkit-transform: rotate(0deg); }
    //    to { -webkit-transform: rotate(360deg); }
    //}
    //
    var loadingStyle = "<style type='text/css'>.glyphicon.spinning{animation:spin 1s infinite linear;-webkit-animation:spin2 1s infinite linear}@keyframes spin{from{transform:scale(1) rotate(0)}to{transform:scale(1) rotate(360deg)}}@-webkit-keyframes spin2{from{-webkit-transform:rotate(0)}to{-webkit-transform:rotate(360deg)}}</style>";

    //Atribuindo o style ao cabeçalho do HTML
    angular.element(document).find('head').prepend(loadingStyle);
});

//Factory request para requisições ajax.
barbaraJs.factory("$request", function($http){

    //Gerar meta a partir do response
    var getMetaResponse = function(response){
        return {
            code          : response.status,
            error_message : response.status == 200 ? 'Bad structure response!' : response.statusText
        };
    };

    //Callback quando o response.status for entre 200 e 299.
    var callbackSuccess = function(response, request, success, error){
        //Verificar se algum callback de loaded
        if(angular.isDefined(request.callbackLoad))
            request.callbackLoad.loaded();

        //Chamar callback de sucesso caso for escolhido para "não" verificar meta no response.data
        if(!request.checkMeta)
            success(response);

        //Chamar callback de error caso o response.data não for um objeto (json)
        else if(!angular.isObject(response.data))
            error(getMetaResponse(response), response.status, response);

        //Verificar se há meta no response.data e se existe existe o atributo code para validar a requisição
        else if(angular.isObject(response.data.meta) && angular.isDefined(response.data.meta.code)){

            //Verificar se o meta.code corresponde ao código de sucesso, então chama o callback de sucesso
            if(response.data.meta.code >= 200 && response.data.meta.code <= 299)
                success(response.data.data, response.data.meta, response);

            //Caso o meta.code não estiver entre 200 a 299, retornar como callback de erro.
            else
                error(response.data.meta, response.status, response);

            //Caso seja definidos callbacks adicionais para determinados meta.code, serão executados aqui após.
            angular.forEach(request.callback, function(callback) {
                //Verificar se o meta.code do response for igual ao metacode definido pelo callback adicional.
                // Se for, executa o callback
                if(this.code == callback.metaCode)
                    callback.callback(response.data.data, response.data.meta, response);
            }, response.data.meta);

        }
        //Caso não atenda nenhum dos requisitos, retorna o callback de erro se for definido.
        else
            error(getMetaResponse(response), response.status, response);

    };

    //Callback quando o response.status for considerado como erro.
    var callbackError = function(response, request, error){
        //Verificar se algum callback de loaded
        if(angular.isDefined(request.callbackLoad))
            request.callbackLoad.loaded();

        error(getMetaResponse(response), response.status, response);
    };

    //Atributos e métodos do $request
    return {
        //Lista de parametros ou dados para enviar
        parameter : {},

        //Lista de cabeçalho adicional, caso necessário
        headers : {},

        //Método de requisição atual
        method : 'GET',

        //URL para requisição
        url : undefined,

        //Lista de Callbacks adicionais
        callback : [],

        //Configurações adicional para requisição
        callbackLoad : undefined,

        //Verificar o meta no response.data
        checkMeta : true,

        //Configurações adicional para requisição
        config : {},

        //Mudar a verificação do meta no response.data
        checkResponse : function(check){
            //Verifica se o atributo é valido ou não.
            this.checkMeta = check ? true : false;
            return this;
        },

        //Adicionar callbacks adicionais para o meta.code
        addCallback : function(metaCode, callback){
            //Verficar se o metaCode é um número e o callback é função.
            // Se a condição for valida, adiciona o callback na lista
            if(angular.isNumber(metaCode) && angular.isFunction(callback))
                this.callback.push({ metaCode : metaCode, callback : callback });
            return this;
        },

        //Adicionar método de requisição
        addMethod : function(method){
            //Verificar se o method é string, para adicionar ao método de requisição
            this.method = angular.isString(method) ? method : 'GET';
            return this;
        },

        //Adicionar dados ou parametros para enviar
        addData : function(param){
            //Verificar se o param é objeto, para adicionar ao dados/param para enviar
            this.parameter = angular.isObject(param) ? param : {};
            return this;
        },

        //Adicionar cabeçalho adicional
        addHeaders : function(headers){
            //Verificar se o headers é objeto, para adicionar ao cabeçalho adicional
            this.headers = angular.isObject(headers) ? headers : {};
            return this;
        },

        //Adicionar callback de carregamento.
        load : function(onLoading, loaded){

            //Verificar se o onLoading é um objeto do bootstrap.loading
            if(angular.isObject(onLoading)){
                //Verificar se os callbacks loading e loaded existem
                if(angular.isFunction(onLoading.loading) && angular.isFunction(onLoading.loaded)){
                    loaded = onLoading.loaded;
                    onLoading = onLoading.loading;
                }
            }

            //Verificar se onLoading e loaded são callbacks validos!
            if(!angular.isFunction(onLoading) || !angular.isFunction(loaded))
                throw "Load Callback invalid!";

            //atribuindo os callbacks à variavel callbackLoad
            this.callbackLoad = {
                onLoading : onLoading,
                loaded : loaded
            };

            return this;
        },

        //Obter $request para requisição get
        get : function(url){
            //Verificar se o url é string para adicionar ao url atual.
            this.url = angular.isString(url) ? url : this.url;
            //Mudar o método de requisição
            this.addMethod('GET');
            //Ajustar as configurações adicionais da requisição
            this.config.headers = this.headers;
            //Retornar copia do objeto.
            return angular.copy(this);
        },

        //Obter $request para requisição post
        post : function(url){
            //Verificar se o url é string para adicionar ao url atual.
            this.url = angular.isString(url) ? url : this.url;
            //Mudar o método de requisição
            this.addMethod('POST');
            //Ajustar as configurações adicionais da requisição
            this.config.headers = this.headers;
            //Retornar copia do objeto.
            return angular.copy(this);
        },

        //Obter $request para requisição put
        put : function(url){
            //Verificar se o url é string para adicionar ao url atual.
            this.url = angular.isString(url) ? url : this.url;
            //Mudar o método de requisição
            this.addMethod('PUT');
            //Ajustar as configurações adicionais da requisição
            this.config.headers = this.headers;
            //Retornar copia do objeto.
            return angular.copy(this);
        },

        //Obter $request para requisição delete
        delete : function(url){
            //Verificar se o url é string para adicionar ao url atual.
            this.url = angular.isString(url) ? url : this.url;
            //Mudar o método de requisição
            this.addMethod('DELETE');
            //Ajustar as configurações adicionais da requisição
            this.config.headers = this.headers;
            //Retornar copia do objeto.
            return angular.copy(this);
        },

        //Enviar requisição
        send : function(success, error){
            //Atribuir a referencia do objeto para variavel request
            var request = this;

            //Verificar se o parametro success é uma função
            if(!angular.isFunction(success))
                throw "Success Callback invalid in $request!";

            //Caso não exista callback de erro, criar um.
            if(!angular.isFunction(error))
                error = function(){};

            //Verificar se algum url foi definido para continuar a requisição
            if(!angular.isDefined(request.url))
                throw "No url defined in the request methods!";

            //Verificar se algum callback de loading
            if(angular.isDefined(request.callbackLoad))
                request.callbackLoad.onLoading();

            //Escolher qual método executar de acordo com o armazenado em request.method
            switch (request.method){

                case 'GET' :
                    request.config.params = request.parameter;
                    $http.get(request.url, request.config)
                         .then(function(response){
                             callbackSuccess(response, request, success, error);
                         }, function(response){
                             callbackError(response, request, error);
                         });
                break;

                case 'POST' :
                    $http.post(request.url, request.parameter, request.config)
                        .then(function(response){
                            callbackSuccess(response, request, success, error);
                        }, function(response){
                            callbackError(response, request, error);
                        });
                break;

                case 'PUT' :
                    $http.put(request.url, request.parameter, request.config)
                        .then(function(response){
                            callbackSuccess(response, request, success, error);
                        }, function(response){
                            callbackError(response, request, error);
                        });
                break;

                case 'DELETE' :
                    request.config.data = request.parameter;
                    $http.delete(request.url, request.config)
                        .then(function(response){
                            callbackSuccess(response, request, success, error);
                        }, function(response){
                            callbackError(response, request, error);
                        });
                break;
            }
        }
    };
});

//Factory bootstrap para alguns recursos do framework css
barbaraJs.factory("bootstrap", function(){
    return {
        //Configuração do alert para diretiva (alert-bootstrap)
        alert : function(){
            return {
                //Visibilidade da diretiva
                show : false,

                //Mudar Visibilidade da direitva
                changeShow : function( show ){
                    this.show = angular.isDefined(show) ? show : !this.show;
                },

                //Tipo de alerta (info, success, danger, warning)
                type : undefined,

                //Mudar tipo de alerta
                changeType : function(type){
                    this.type = type;
                },

                //Título do alerta
                title : undefined,

                //Mudar título do alerta
                changeTitle : function(title){
                    this.title = title;
                },

                //Mensagem do alerta
                message : undefined,

                //Mudar mensagem do alerta
                changeMessage : function(message){
                    this.message = angular.isString(message) ? message : this.message;
                },

                //Personalizar alerta para response de sucesso
                responseSuccess : function(message){
                    if(angular.isString(message)) {
                        this.changeTitle('Parabéns!');
                        this.changeType('success');
                        this.changeMessage(message);
                        this.changeShow(true);
                    }
                },

                //Personalizar alerta para response de erro
                responseError : function(meta){
                    this.changeTitle('Algo deu errado!');
                    this.changeType('danger');

                    if(angular.isDefined(meta.error_message) && angular.isString(meta.error_message)){
                        this.changeMessage(meta.error_message);
                        this.changeType('warning');
                    } else
                        this.changeMessage("Ocorreu um erro na requisição! Talvez o servidor " +
                                           "esteja em manutenção.");
                    this.changeShow(true);
                }
            };
        },

        //Configuração do loading para diretiva (loading-bootstrap)
        loading : function(){
            return {
                //Visibilidade da diretiva
                show : false,

                //Mudar Visibilidade da direitva
                changeShow : function( show ){
                    this.show = angular.isDefined(show) ? show : !this.show;
                },

                //Mensagem de loading
                message : 'Carregando...',

                //Mudar mensagem do loading
                changeMessage : function(message){
                    this.message = angular.isString(message) ? message : this.message;
                },

                //Mostrar mensagem de carregamento
                onLoading : function(message){
                    this.message = angular.isString(message) ? message : this.message;
                    this.changeShow(true);
                },

                //Deixar de exibir mensagem de carregamento
                loaded : function(){
                    this.changeShow(false);
                },

                //Obter loading trabalhado para o $request
                getRequestLoad : function(message){
                    var loading = this;
                    return {
                        loading : function(){
                            loading.onLoading(message);
                        },
                        loaded : function(){
                            loading.loaded();
                        }
                    };
                }
            };
        }
    };
});

//Direitava alert-bootstrap
barbaraJs.directive('alertBootstrap', function () {
    return {
        restrict : 'A',
        //Template html da diretiva
        //HTML Template não minificado
        //
        //<div class='alert alert-{{alert.type}} alert-dismissible' role='alert' ng-if='alert.show'>
        //  <button type='button' class='close' ng-click='alert.changeShow()'>
        //      <span aria-hidden='true'>&times;</span>
        //  </button>
        //  <strong>{{alert.title}}</strong> {{alert.message}}
        //</div>
        //
        template : "<div class='alert alert-{{alert.type}} alert-dismissible' role='alert' ng-if='alert.show'><button type='button' class='close' ng-click='alert.changeShow()'><span aria-hidden='true'>&times;</span></button><strong>{{alert.title}}</strong> {{alert.message}}</div>"
    };
});

//Direitava loading-bootstrap
barbaraJs.directive('loadingBootstrap', function () {
    return {
        restrict : 'A',
        //Template html da diretiva
        //HTML Template não minificado
        //
        //<div class='progress' ng-if='loading.show'>
        //    <div class='progress-bar progress-bar-striped active' role='progressbar' style='width: 100%'>
        //        <i class='glyphicon glyphicon-refresh spinning'></i> <strong>{{loading.message}}</strong>
        //    </div>
        //</div>
        //
        template : "<div class='progress' ng-if='loading.show'> <div class='progress-bar progress-bar-striped active' role='progressbar' style='width: 100%'><i class='glyphicon glyphicon-refresh spinning'></i> <strong>{{loading.message}}</strong></div></div>"
    };
});

//Filtro para mostrar data de forma mais amigável ex: (há 7d, há 32sm, há 4a)
barbaraJs.filter("timeago", function () {

    return function (time) {
        //Variavel para hora atual
        var local = new Date().getTime();

        //Verificar se há algum dado
        if (!time)
            return "indefinido";

        //Verificar se time é um objeto Date
        if (angular.isDate(time))
            time = time.getTime();

        //Verificar se o time é um timestamp
        else if (angular.isNumber(time))
            time = new Date(time * 1000).getTime();

        //Verificar se o time é uma data em string
        else if (angular.isString(time))
            time = new Date(time).getTime();

        //Verificar se retornou uma data válida
        if (!angular.isNumber(time))
            return "Data invalida";

        //Atributos de configurações para calculos
        var offset = Math.abs((local - time) / 1000),
            span = [],
            MINUTE = 60,
            HOUR = 3600,
            DAY = 86400,
            WEEK = 604800,
            YEAR = 31556926;

        //Calculos para determinar o tempo decorrido
        if (offset <= MINUTE)              span = [ '', 'agora' ];
        else if (offset < (MINUTE * 60))   span = [ Math.round(Math.abs(offset / MINUTE)), 'm' ];
        else if (offset < (HOUR * 24))     span = [ Math.round(Math.abs(offset / HOUR)), 'h' ];
        else if (offset < (DAY * 7))       span = [ Math.round(Math.abs(offset / DAY)), 'd' ];
        else if (offset < (WEEK * 52))     span = [ Math.round(Math.abs(offset / WEEK)), 'sm' ];
        else if (offset < (YEAR * 10))     span = [ Math.round(Math.abs(offset / YEAR)), 'a' ];
        else                               span = [ '', '...' ];

        //Transformar array em string separado por espaço
        span = span.join('');

        //Retornar data em formato decorrido
        return (time <= local) ? 'há ' + span + '' : span;
    }
});

//Filtro para truncar texto com opção de ignorar dinamicamente
barbaraJs.filter('cuttext', function () {
    return function (value, ignoreFilter, max, tail) {
        //Verificar se o valor é valido
        if (!value || !angular.isString(value))
            return '';

        //Verificar se o tamanho maximo do texto é um número valido, caso contrario retorna o valor original
        if (!max || !angular.isNumber(max))
            return value;

        //Converter maximo para inteiro
        max = parseInt(max, 10);

        //Verificar se o tamanho do texto é menor que o tamanho máximo ou se o filtro foi ignorado
        //Caso a condição seja verdadeira, retornar o valor original
        if (value.length <= max || ignoreFilter)
            return value;

        //Trunca o texto para o tamanho definido
        value = value.substr(0, max);

        //Verifica se o ultimo elemento do texto é um espaço
        var lastspace = value.lastIndexOf(' ');

        //Caso o ultimo elemento seja um espaço, ele é truncado novamente
        if (lastspace != -1)
            value = value.substr(0, lastspace);

        //Retornar texto formatado
        return value + (tail || ' …');
    };
});