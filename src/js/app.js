'use strict';

/* App */

var replaceURLWithHTMLLinks = function(text) {
    var exp = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(exp,"<a target='_blank' href='$1'>$1</a>"); 
};
var totext = function(htm) {
  if(htm) return htm.replace(/<[^>]+>/gm,'');
  else return "";
};

/* Controllers */

angular.module('underscore', [])
  .factory('_', function() {
    return window._; // assumes underscore has already been loaded on the page
  });
  
angular.module('manifest', [
  'ngRoute',
  'ngSanitize',
  'ngTouch',
  //'ngScroll',
  'manifest.directives',
  'manifest.filters',
  'manifest.maincontroller',
  'manifest.mapcontroller',
  'config'
])

  .config(['$routeProvider','$locationProvider',"settings", function($routeProvider,$locationProvider,settings) {
    
    //$locationProvider.html5Mode(true);

    console.log("App Settings",settings);
    
    var lang = navigator.language;

    $routeProvider.when('/:lang', {
      templateUrl: settings.assets + '/partials/layout.html',
      controller: 'mainController'
      // reloadOnSearch: false
    });

    $routeProvider.when('/:lang/:layout', {
      templateUrl: settings.assets + '/partials/layout.html',
      controller: 'mainController',
      //reloadOnSearch: false
    });

    $routeProvider.when('/:lang/:layout/:tags', {
      templateUrl: settings.assets + '/partials/layout.html',
      controller: 'mainController',
      //reloadOnSearch: false
    });

    // $routeProvider.when('/:lang/:layout/:forcedev', {
    //   templateUrl: settings.assets + '/partials/layout.html',
    //   controller: 'mainController'
    //   // reloadOnSearch: false
    // });

    $routeProvider.otherwise({
      redirectTo: '/fr'
    });

  }])
  
  .run(function() {
    FastClick.attach(document.body);
  });

