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
    if($routeParams.forcedev) $scope.settings.dev = true;
    $scope.meta = {};
    $scope.tags = {};
    $scope.mentionedTags = {};
    $scope.links = {};
    $scope.state = {
      intro: !$scope.settings.dev,
      showgraph: false,
      commenting_slug: null,
      toggle_all: null,
      lang: $routeParams.lang,
      layout: $routeParams.layout ? $routeParams.layout : "list"
    };
    console.log("state:",$scope.state);

    $scope.paragraphs = [];

    $scope.layoutTemplate = function() {
      return $scope.settings.assets+'partials/sections_'+$scope.state.layout+'.html';
    };

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


    ////////////////////////////////////////// TAG GRAPH
    var loadTagGraph = function() {
      // sigma test
      var g = sigma.parsers.gexf(
        settings.datapath + "tags.gexf",
        { container: 'sigma-tags' },
        function(s) {
          //console.log(s.graph);
          
          //s.graph.settings.labelThreshold = 0;

          var ids = {} ;
          var orphans = [];

          _.each(s.graph.nodes(), function(n) {
            //console.log(n);
            var t = n.label;
            
            ids[n.label] = n.id;

            if($scope.tags[t] && $scope.links[t]) {
              n.size = 15 + $scope.links[t].length;
              //n.label = n.size +" "+ t +" - "+ $scope.tags[t];
            } else {
              orphans.push(t);
              n.size = 1;
              //n.label = t;
            }
          });

          console.log("!! graph nodes non defined:",orphans);

          _.each(s.graph.edges(), function(e) {
            //console.log(e);
            //s.graph.dropEdge(e.id);
            e.color = "rgb(200,200,200)";
          });

          _.each($scope.templinks, function(l,i) {
            s.graph.addEdge({
              id: "new_"+i,
              source: ids[l[0]],
              target: ids[l[1]],
              color: "rgb(200,50,50)"
            });
          });

          s.refresh();
        }
      );
    }


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

    var getLinksFromTags = function(tags) {
      var out = [];
      _.each(tags, function(t) {
        out = _.union(out, $scope.links[t]);
      });
      return out;
    }

    $scope.getInjectLinks = function() {
      $http
        .get(settings.datapath + "links_"+$scope.state.lang+".yml")
        .success(function(res) {

          var bloks = res.split('\n\n');

          $scope.templinks = [];

          _.each(bloks, function(l) {
            var tgs = l.split('\n')[0].match(/\w+/ig);
            
            ///// temp observe graph
            if(tgs && tgs.length>2) {
              _.each(tgs, function(t1) {
                _.each(tgs, function(t2) {
                  if(t1!=t2)
                    $scope.templinks.push([t1,t2]);
                });
              });
            }

            var htm = md2Html( l.split('\n')[1] );
            _.each(tgs, function(t) {
              if(!$scope.links[t]) $scope.links[t] = [];
              $scope.links[t].push(htm);
            });
          });

          if($scope.settings.dev) {
            console.log("!! official tags:",_.keys($scope.tags));
            console.log("!! tags in links:",$scope.links);
            console.log("!! tags in sections:",$scope.mentionedTags);
            console.log("!! non cited in sections:", _.difference(_.keys($scope.links), _.keys($scope.mentionedTags)));
            console.log("!! found non-official tags:", _.difference(_.keys($scope.links), _.keys($scope.tags)));
            console.log("!! found orphan tags:", _.difference(_.keys($scope.tags), _.keys($scope.links)));
          }

          _.each($scope.paragraphs, function(p) {
            p.links = getLinksFromTags(p.tags);
          });

          if($scope.settings.dev) loadTagGraph();

        })
        .error(function (data, status, headers, config) {
          console.log("error links",status);
        });
    };

    ////////////////////////////////////////// GET CONTENTS
    var sectionsUrl = $scope.settings.dev ?
      settings.datapath + "sections_"+$scope.state.lang+".yml" :
      settings.datapath + "contents_"+$scope.state.lang+".yml";

    $http
      .get(sectionsUrl)
      .success(function(res) {
        jsyaml.loadAll(res, function(d) {

          if(d.role && d.role=='splash') { /////////// META

            $scope.meta = d;
            //$scope.meta.about = md2Html($scope.meta.about);
            $scope.meta.footer = md2Html($scope.meta.footer);
            // for html page meta
            $rootScope.htmlmeta = d.htmlmeta;

            $scope.tags = d.tags;
            

          } else { /////////// SECTIONS

            //console.log(d);
            d.subtitle = md2Html(d.subtitle);
            if(d.quote) {
              d.quote.content = md2Html(d.quote.content);
              d.quote.author = md2Html(d.quote.author);
            }
            d.content = md2Html(d.content);
            d.tags = d.tags ? d.tags.split(', ') : [];
            _.each(d.tags, function(t) {
              $scope.mentionedTags[t] = $scope.mentionedTags[t] ? $scope.mentionedTags[t]+1 : 1;
            });
            d.links = md2Html(d.links);
            $scope.paragraphs.push(d);

          }
        });
        

        // now fetch links and inject them based on tags
        if($scope.settings.dev)
          $scope.getInjectLinks();

        // (to improve) init here to trigger the watch on footer content set though compile-html directive
        $scope.state.term = "";
      })
      .error(function (data, status, headers, config) {
        console.log("error sections",status);
      });



    // disqus
    (function() {
      var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
      dsq.src = '//manifestes.disqus.com/embed.js';
      (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
    })();
      

  }]);
  