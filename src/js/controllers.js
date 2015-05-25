'use strict';

/* Controllers */

angular.module('underscore', [])

  .factory('_', function() {
    return window._; // assumes underscore has already been loaded on the page
  });


angular.module('manifest.controllers', ['underscore','config'])

  .controller('manifestController', [
    "$scope",
    "$routeParams",
    "$http",
    "_",
    "$document",
    "$window",
    "$location",
    "$timeout",
    "$sce",
    "$rootScope",
    "settings",
    function ($scope, $routeParams, $http, _, $document, $window, $location, $timeout, $sce, $rootScope, settings) {
    
    //console.log("settings:",settings);
    $scope.settings = settings;
    $scope.meta = {};
    $scope.state = {
      intro: true,
      commenting_slug: null,
      toggle_all: null,
      lang: $routeParams.lang
    };
    console.log("state:",$scope.state);

    $scope.paragraphs = [];

    $scope.openComments = function(p) {
      $scope.state.commenting_slug = p.slug;
      $timeout(function(){
        var disqus_shortname = 'manifestes';
        var disqus_identifier = $scope.state.commenting_slug;
        var disqus_url = 'http://manifest.es/'+disqus_identifier;

        console.log("reloading comments: ",disqus_url);
        DISQUS.reset({
          reload: true,
          config: function () {
            this.page.identifier = disqus_identifier;  
            this.page.url = disqus_url;
          }
        });
      }); // timeout to be sure disqus div is here ?
    };
    
    $scope.getRandomInt = function(){
      return Math.floor((Math.random()*7));
    }


    $scope.filterUpdate = function() {
      window.scrollTo(0,0);
    };

    $scope.clickTag = function(t) {
      if(t) {
        $scope.state.term = t.search;
        window.scrollTo(0,0);
      }
      else {
        $scope.state.term = "";
        $scope.toggleAll(false);
      }
    };

    // $scope.clickMenu = function(k) {
    //   var target = document.getElementById('p_'+k);
    //   //console.log("o",target.offsetTop);
    //   //target.scrollIntoView({block: "end", behavior: "smooth"});
    //   window.scrollTo(0,target.offsetTop - 110);
    //   //window.scrollBy(0,-40);
    // };
    
    $scope.highlight = function(text) {
      if(!$scope.state.term || $scope.state.term.length<3) {
        return $sce.trustAsHtml(text);
      }
      return $sce.trustAsHtml(text.replace(new RegExp($scope.state.term, 'gi'), '<span class="highlight">$&</span>'));
    };
    $scope.atLeastContains = function(p) {
      var reg = new RegExp($scope.state.term,'gi');

      var show = reg.test(p.quote.content);

      var watch = ['title','subtitle','content','links'];
      _.each(watch, function(k) {
        show = show || reg.test(p[k]);
      });
      return show;
    };

    $scope.toggleOne = function(p) {
      p.opened = !p.opened ;
      if(!p.commentcount) {
        $timeout(function() {
          updateCommentsCount(p);
        }); // wait for the section to open !
      }
    };
    $scope.toggleAll = function(status) {
      _.each($scope.paragraphs, function(p) {
        p.opened = status;
        if(status && !p.commentcount)
          $timeout(function() {
            updateCommentsCount(p);
          });
      });
    };


    var md2Html = function(str) {
      return str ? markdown.toHTML(str) : "";
    };


    ////////////////////////////////////////// GET COMMENTS COUNT
    var updateCommentsCount = function(p) {
      var params = {
        api_key: settings.disquskey,
        forum : "manifestes",
        thread : "ident:"+p.slug,
        callback: "JSON_CALLBACK"
      };
      
      var serialize = function(obj, prefix) {
        var str = [];
        for(var p in obj) {
          if (obj.hasOwnProperty(p)) {
            var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
            str.push(typeof v == "object" ?
            serialize(v, k) :
            encodeURIComponent(k) + "=" + encodeURIComponent(v));
          }
        }
        return str.join("&");
      }

      var url = "https://disqus.com/api/3.0/threads/set.jsonp?"+serialize(params);
      // console.log(url);

      $http.jsonp(url)
        .success(function(data){
          var res = data.response;
          var count = res.length ? res[0].posts : 0;
          //console.log("found comments count:",count);
          p.commentcount = count;
        })
        .error(function (data, status, headers, config) {
          console.log("error disqus",status);
        });
    };


    ////////////////////////////////////////// GET CONTENTS
    $http
      .get(settings.datapath + "contents_"+$scope.state.lang+".yml")
      .success(function(res) {
        jsyaml.loadAll(res, function(d) {

          if(d.role && d.role=='splash') { // META

            $scope.meta = d;
            //$scope.meta.about = md2Html($scope.meta.about);
            $scope.meta.footer = md2Html($scope.meta.footer);
            // for html page meta
            $rootScope.htmlmeta = d.htmlmeta;

          } else { // SECTIONS

            //console.log(d);
            d.subtitle = md2Html(d.subtitle);
            if(d.quote) {
              d.quote.content = md2Html(d.quote.content);
              d.quote.author = md2Html(d.quote.author);
            }
            d.content = md2Html(d.content);
            d.links = md2Html(d.links);
            $scope.paragraphs.push(d);

          }
        });

        // (to improve) init here to trigger the watch on footer content set though compile-html directive
        $scope.state.term = "";
      })
      .error(function (data, status, headers, config) {
        console.log("error contents",status);
      });

      // disqus
      (function() {
        var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
        dsq.src = '//manifestes.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
      })();
      

  }]);
  