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
    
    moment.locale('fr');

    //console.log("settings:",settings);
    $scope.settings = settings;
    if($routeParams.forcedev) $scope.settings.dev = true;
    var layout = $routeParams.layout ?
      (["sections","links","print"].indexOf($routeParams.layout)==-1 ? "sections" : $routeParams.layout) :
      "sections";

    $scope.meta = {}; // mainly the meta info at start of section.yml
    $scope.sections = [];
    $scope.tagsContents = {}; // .label & .description dor each tag
    $scope.sectionNbByTag = {}; // how many sections by tag
    $scope.linksArray = []; // raw list of links
    $scope.linksByTag = {}; // related links for each tag
    
    $scope.state = {
      intro: !$scope.settings.dev, // splash fullscreen panel
      commenting_slug: null, // current disqus id
      lang: $routeParams.lang,
      layout: layout,
      tags: [], // list of current filtering tags
      graphstatus: "NO", // loaded or not ?
    };
    console.log("state:",$scope.state);

    

    // $scope.clickMenu = function(k) {
    //   var target = document.getElementById('p_'+k);
    //   //console.log("o",target.offsetTop);
    //   //target.scrollIntoView({block: "end", behavior: "smooth"});
    //   window.scrollTo(0,target.offsetTop - 110);
    //   //window.scrollBy(0,-40);
    // };



    $scope.layoutTemplate = function() {
      return $scope.settings.assets+'partials/layout_'+$scope.state.layout+'.html';
    };
    $scope.sectionTemplate = function(s) {
      return $scope.settings.assets+'partials/layout_sections_'+s.layout+'.html';
    };

    var scrollToup = function() {
      document.getElementById("container").scrollTo(0,0);
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
    
    $scope.getRandomInt = function() {
      return Math.floor((Math.random()*7));
    };


    $scope.changeLayout = function(lay) {
      if(lay != $scope.state.layout) {
        $scope.state.layout = lay;
        if(lay!='links') {
          $scope.state.graphstatus="NO";
          //loadLinksGraph($scope);
        }
      }
    };
    $scope.loadLinksGraph = function() {
      loadLinksGraph($scope);
    };



    $scope.tagDescription = function(tag) {
      if(tag && $scope.tagsContents[tag]) {
        $scope.state.tagdescription = $scope.tagsContents[tag].description;
      } else {
        $scope.state.tagdescription = $scope.meta.menu.tagsdescription;
      }
      $scope.$apply();
    };

    $scope.isTagActive = function(tag) {
      return $scope.state.tags.indexOf(tag)!=-1;
    };




    $scope.resetFilters = function() {
      $scope.toggleTag();
      $scope.searchSubmit();
      $scope.$apply();
    };

    $scope.toggleTag = function(tag,refresh) {

      // please set max tags to 5 !

      if(!tag)
        $scope.state.tags = [];
      else {
        if($scope.state.tags) {
          if($scope.state.tags.indexOf(tag)==-1)
            $scope.state.tags.push(tag);
          else
            $scope.state.tags = _.without($scope.state.tags,tag);
        } else {
          $scope.state.tags = [tag];
        }
      }
      console.log("state tags:",$scope.state.tags);
      
      // update graph node colors
      updateTagNodes($scope.state.tags);

      if(refresh) $scope.$apply();
      scrollToup();
    };


    $scope.searchSubmit = function(term) {
      if(term) {
        $scope.state.search = term;
      }
      else {
        $scope.input = "";
        $scope.state.search = "";
        $scope.toggleAll(false);
      }
      
      $scope.rgx.search = new RegExp($scope.state.search,'gi');

      if($scope.state.graphstatus=='OK')
        filterLinksNodes($scope.state.search);

      scrollToup();
    };

    
    $scope.rgx = {};
    $scope.rgx.inlnk = new RegExp("<[^>]*>","gi");
    $scope.rgx.search = new RegExp("",'gi'); // is updated after each keystroke on search input
    var totext = function(htm) {
      return htm.replace(/<[^>]+>/gm,'');
    };


    $scope.highlight = function(html) {
      if(!$scope.state.search || $scope.state.search.length<3) {

        return $sce.trustAsHtml(html);

      } else {
        
        var rgxp = $scope.rgx.search;

        var text = totext(html);

        if(!rgxp.test(text)) { // if flattened html don't matches

          return $sce.trustAsHtml(html);

        } else {

          var inlnkmatches = html.match($scope.rgx.inlnk);
        
          // if at least one link rawtag matches, highlight all
          if(inlnkmatches && rgxp.test( inlnkmatches.join("") )) {

            return $sce.trustAsHtml('<div class="highlight">'+html+'</div>');

          } else {

            if( !rgxp.test(html) ) { // if html don't match, but flattened text matches, higlight all
              return $sce.trustAsHtml('<div class="highlight">'+html+'</div>');
            } else {
              return $sce.trustAsHtml(html.replace(rgxp,'<span class="highlight">$&</span>'));
            }

          }

        }
      }
    };
    $scope.shallShowSearch = function(o) { // "o" is a section or a link
      var reg = new RegExp($scope.state.search,'gi'); //$scope.rgx.search;

      if(o.title) { // a section
        var show = reg.test(totext(o.quote.content));
        _.each(['title','subtitle','content'], function(k) {
          show = show || reg.test(totext(o[k]));
        });
      } else { // a link
        var show = reg.test(totext(o.content));
      }
      return show;
    };
    $scope.shallShowTags = function(o,onlyintersect) { // "o" is a section or a link
      if($scope.state.tags.length && o.tags) {
        var interslen = _.intersection(o.tags,$scope.state.tags).length;
        if(onlyintersect) {
          return interslen == $scope.state.tags.length;
        }
        else {
          return interslen > 0;
        }
      } else
        return true;
    }


    $scope.toggleOne = function(p) {
      p.opened = !p.opened ;
      if(!p.commentcount) {
        $timeout(function() {
          updateCommentsCount(p);
        }); // wait for the section to open !
      }
    };
    $scope.toggleAll = function(status) {
      _.each($scope.sections, function(p) {
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

    var getLinksFromTags = function(tags) {
      var out = [];
      _.each(tags, function(t) {
        out = _.union(out, $scope.linksByTag[t]);
      });
      return out;
    }

    $scope.getInjectLinks = function() {
      $http
        .get(settings.datapath + "links_"+$scope.state.lang+".yml")
        .success(function(res) {

          var singlelink = res.split('\n\n');

          $scope.templinks4graph = [];

          _.each(singlelink, function(l) {

            var tgs = l.split('\n')[0].match(/\w+/ig);
            
            // (test/dev) just to see links over graph
            if(tgs && tgs.length>2) {
              _.each(tgs, function(t1) {
                _.each(tgs, function(t2) {
                  if(t1!=t2)
                    $scope.templinks4graph.push([t1,t2]);
                });
              });
            }

            var htm = md2Html( l.split('\n')[1] );

            // store links as array
            $scope.linksArray.push({
              content: htm,
              tags: tgs
            });

            // store links indexed by tag
            _.each(tgs, function(t) {
              if(!$scope.linksByTag[t]) $scope.linksByTag[t] = [];
              $scope.linksByTag[t].push(htm);
            });
          });

          if($scope.settings.dev) {
            console.log("!! declared tags:",_.keys($scope.meta.tags));
            console.log("!! declared tags contents:",$scope.tagsContents);
            console.log("!! all links:",$scope.linksArray);
            console.log("!! nb of links by tag:",$scope.linksByTag);
            console.log("!! tags used in sections:",$scope.sectionNbByTag);
            console.log("!! non used in sections:", _.difference(_.keys($scope.linksByTag), _.keys($scope.sectionNbByTag)));
            console.log("!! non-declared tags:", _.difference(_.keys($scope.linksByTag), _.keys($scope.meta.tags)));
            console.log("!! declared tags with 0 link", _.difference(_.keys($scope.meta.tags), _.keys($scope.linksByTag)));
          }

          _.each($scope.sections, function(p) {
            p.links = getLinksFromTags(p.tags);
          });

        })
        .error(function (data, status, headers, config) {
          console.log("error links",status);
        });
    };

    ////////////////////////////////////////// GET CONTENTS
    var sectionsUrl = settings.datapath + "sections_"+$scope.state.lang+".yml";

    $http
      .get(sectionsUrl)
      .success(function(res) {

        jsyaml.loadAll(res, function(d) {

          //////////////////////////////////////////// PARSING META
          if(d.role && d.role=='splash') {

            $scope.meta = d;
            //$scope.meta.about = md2Html($scope.meta.about);
            $scope.meta.footer.content = md2Html($scope.meta.footer.content);
            
            // for html page meta
            $rootScope.htmlmeta = d.htmlmeta;

            _.each(d.tags, function(v,k) {
              $scope.tagsContents[k] = {
                label: v.split(' = ')[0],
                description: v.split(' = ')[1],
              };
            });
            

            //////////////////////////////////////////// PARSING SECTIONS
          } else { 

            //console.log(d);
            d.subtitle = md2Html(d.subtitle);
            if(d.quote) {
              d.quote.content = md2Html(d.quote.content);
              d.quote.author = md2Html(d.quote.author);
            }
            d.content = md2Html(d.content);
            d.tags = d.tags ? d.tags.split(', ') : [];
            _.each(d.tags, function(t) {
              $scope.sectionNbByTag[t] = $scope.sectionNbByTag[t] ? $scope.sectionNbByTag[t]+1 : 1;
            });
            d.links = md2Html(d.links);

            d.date = moment(d.date);
            var seuil = moment().subtract(30,"day");
            if(d.date > seuil)
              d.date = d.date.fromNow();
            else
              d.date = null;
            
            d.currentlink = 0;

            d.layout = 'flat'; //Math.random()<0.2 ? 'grid' : 'flat';

            $scope.sections.push(d);

          }
        });
        

        // now fetch links and inject them based on tags
        $scope.getInjectLinks();

        // please wait before loading graphs !
        $timeout(function() {

          loadTagGraph($scope);

        },500);

        // (to improve) init here to trigger the watch on footer content set though compile-html directive
        $scope.state.search = "";

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
  