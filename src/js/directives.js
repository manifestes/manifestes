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

  // input enter keypress
  .directive('ngEnter', function () {
    return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
        if(event.which===13) {
          scope.$apply(function(){
            scope.$eval(attrs.ngEnter);
          });

          event.preventDefault();
        }
      });
    };
  })

  // will add a target blank to open ALL links having href in a new tab
  .directive('href', function ($timeout) {
    return {
      compile: function(element) {
        element.attr('target', '_blank');
        element.attr('onclick','event.stopPropagation();');
      }
    };
  })

  // useful for inputs
  .directive('selectOnClick', ['$window', function ($window) {
      return {
          restrict: 'A',
          link: function (scope, element, attrs) {
              element.on('click', function () {
                  if (!$window.getSelection().toString()) {
                      // Required for mobile Safari
                      this.setSelectionRange(0, this.value.length)
                  }
              });
          }
      };
  }])

  // to be able to use directives (especially href!) on the ng-binded-html !
  // thanks to:
  // http://stackoverflow.com/questions/17417607/angular-ng-bind-html-unsafe-and-directive-within-it

  .directive('compileHere', ['$compile', function ($compile) {
    return function(scope, element, attrs) {
      //var ensureCompileRunsOnce = scope.$watch(
      scope.$watch(
        function(scop) {
          // watch search term
          return scop.state.search;
          //return scope.rgx.search;
        },
        function(val) {
          
          //element.html( scope.highlight(scope.$eval(attrs.compileHere)) )
          element.html( scope.highlight(scope.$eval(attrs.compileHere)) );

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

  