'use strict';

/* Directives */

angular.module('manifest.directives', [])
  
  .directive('backImg', function() {
    return function(scope, element, attrs){
      var url = attrs.backImg;
      element.css({
        'background-image': 'url(' + url +')',
      });
    };
  })

  // will add a target blank to open ALL links having href in a new tab
  .directive('href', function ($timeout) {
    return {
      compile: function(element) {
        element.attr('target', '_blank');
      }
    };
  })

  // to be able to use directives (especially href!) on the ng-binded-html !
  // thanks to:
  // http://stackoverflow.com/questions/17417607/angular-ng-bind-html-unsafe-and-directive-within-it
  .directive('compileHtml', ['$compile', function ($compile) {
    return function(scope, element, attrs) {
      //var ensureCompileRunsOnce = scope.$watch(
      scope.$watch(
        function(scope) {
          // watch search term
          return scope.state.term;
        },
        function(val) {
          
          //element.html( scope.highlight(scope.$eval(attrs.compileHtml)) )
          element.html( scope.highlight(scope.$eval(attrs.compileHtml)) );

          // compile the new DOM and link it to the current
          // scope.
          // NOTE: we only compile .childNodes so that
          // we don't get into infinite loop compiling ourselves
          $compile(element.contents())(scope);

          //ensureCompileRunsOnce();
        }
      );
    };
  }]);