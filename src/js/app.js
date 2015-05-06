'use strict';

/* App */

angular.module('manifest', [
  'ngRoute',
  'ngSanitize',
  //'ngTouch',
  //'ngScroll',
  'manifest.directives',
  'manifest.filters',
  'manifest.controllers',
  'config'
])

  .config(['$routeProvider','$locationProvider',"settings", function($routeProvider,$locationProvider,settings) {
    
    // $locationProvider.html5Mode(true);
    console.log("App Settings",settings);
    
    $routeProvider.when('/', {
      templateUrl: settings.assets + '/partials/layout.html',
      controller: 'manifestController'
      // reloadOnSearch: false
    });

    $routeProvider.otherwise({
      redirectTo: '/'
    });

  }])
  
  .run(function() {
    FastClick.attach(document.body);
  });

