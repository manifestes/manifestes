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
var totextwithbreak = function(htm) {
  if(htm) return htm.replace(/<[^>]+>/gm,'<br>').replace(/(<br> *)+/gm,'<br>');
  else return "";
};
var killhtmlimages = function(htm) {
  if(htm) return htm.replace(/<img[^>]+>/gm,'');
  else return "";
}
var truncatetext = function(str) {
  if(str.length>400)
    return str.substring(0,400)+" [...]";
  else
    return str;
};
function slugify(str) {
  if(!str || str.length<2) return "";
  str = str.replace(/\?|!/g,"");
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();
  // remove accents, swap ñ for n, etc
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to   = "aaaaeeeeiiiioooouuuunc------";
  for (var i=0, l=from.length ; i<l ; i++)
  str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes
  return str;
}

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
  //'manifest.mapcontroller',
  'settings'
])

  .config(['$routeProvider','$locationProvider',"settings", function($routeProvider,$locationProvider,settings) {
    
    //$locationProvider.html5Mode(true);

    console.log("App",settings);
    
    var lang = navigator.language;

    // $routeProvider.when('/:lang', {
    //   templateUrl: settings.assets + '/partials/layout.html',
    //   controller: 'MainController'
    //   // reloadOnSearch: false
    // });

    $routeProvider.when('/:layout', {
      templateUrl: settings.assets + '/partials/layout.html',
      controller: 'MainController',
      //reloadOnSearch: false
    });

    // $routeProvider.when('/:lang/:layout/:tags', {
    //   templateUrl: settings.assets + '/partials/layout.html',
    //   controller: 'MainController',
    //   //reloadOnSearch: false
    // });

    // $routeProvider.when('/:lang/:layout/:forcedev', {
    //   templateUrl: settings.assets + '/partials/layout.html',
    //   controller: 'MainController'
    //   // reloadOnSearch: false
    // });

    // $routeProvider.otherwise({
    //   redirectTo: '/'
    // });

    $routeProvider.otherwise({
      templateUrl: settings.assets + '/partials/layout.html',
      controller: 'MainController',
    });
    
  }])
  // .config(function($httpProvider){
  //   $httpProvider.defaults.useXDomain = true;
  //   delete $httpProvider.defaults.headers.common['X-Requested-With'];
  // })
  .run(function() {
    FastClick.attach(document.body);
  });

