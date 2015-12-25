'use strict';

/* App */

angular.module('manifest', [
  'ngRoute',
  'ngSanitize',
  'ngTouch',
  'akoenig.deckgrid',
  //'ngScroll',
  'manifest.directives',
  'manifest.filters',
  'manifest.controllers',
  'config'
])

  .config(['$routeProvider','$locationProvider',"settings", function($routeProvider,$locationProvider,settings) {
    
    //$locationProvider.html5Mode(true);

    console.log("App Settings",settings);
    
    var lang = navigator.language;

    $routeProvider.when('/:lang', {
      templateUrl: settings.assets + '/partials/layout.html',
      controller: 'manifestController'
      // reloadOnSearch: false
    });

    $routeProvider.when('/:lang/:layout', {
      templateUrl: settings.assets + '/partials/layout.html',
      controller: 'manifestController',
      //reloadOnSearch: false
    });

    $routeProvider.when('/:lang/:layout/:tags', {
      templateUrl: settings.assets + '/partials/layout.html',
      controller: 'manifestController',
      //reloadOnSearch: false
    });

    // $routeProvider.when('/:lang/:layout/:forcedev', {
    //   templateUrl: settings.assets + '/partials/layout.html',
    //   controller: 'manifestController'
    //   // reloadOnSearch: false
    // });

    $routeProvider.otherwise({
      redirectTo: '/fr'
    });

  }])
  
  .run(function() {
    FastClick.attach(document.body);
  });

