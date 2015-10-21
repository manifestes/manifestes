'use strict';

/* Controllers */

angular.module('underscore', [])
  .factory('_', function() {
    return window._; // assumes underscore has already been loaded on the page
  });



angular.module('manifest.controllers', ['underscore','config'])
////////////////////////////////////////////////////////////////////////
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
      (["sections","sectionsprint","links","map","mapprint"].indexOf($routeParams.layout)==-1 ? "sections" : $routeParams.layout) :
      "sections";

    $scope.meta = {}; // mainly the meta info at start of section.yml
    $scope.sectionsArray = []; // raw list of sections
    $scope.tagsContents = {}; // .tag .label .description .icon for each tag
    $scope.tagsContentsOrdered = []; // same but array to be able to sort
    $scope.linksArray = []; // raw list of links
    $scope.linksByTag = {}; // links by tag
    $scope.sectionNbByTag = {}; // sections by tag (only nb)
    
    $scope.settings.verbose = false; // to print detailed stats on tags, objects, etc...

    $scope.state = {
      intro: !$scope.settings.dev, // splash fullscreen panel
      introimage: 0, // slideshow of intro splash images
      commenting_slug: null, // current disqus id
      lang: $routeParams.lang,
      layout: layout, // sections/links/map/print/etc...
      loading: false, // we will show loadingspinner when scope not ready

      disclaim: {
        sections: !$scope.settings.dev,
        links: !$scope.settings.dev,
        map: !$scope.settings.dev
      },

      count: {}, // will count results if search/tags filtered

      tagging: false, // if tags/filtering active or not
      tagsmode: 'grid', // tags display mode: graph OR grid
      tags: [], // list of current filtering tags

      togglesections: null, // wil be 'up' or 'down' to display arrows to open/close all sections

      graphstatus: "NO", // loaded or not ?
      graphfullscreen: false
    };
    
    if($scope.settings.verbose)
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

    $scope.slideSplashImage = function(forward) {
      if($scope.swiping) { return; }
      if(forward)
        $scope.state.introimage +=1;
      else
        $scope.state.introimage -=1;
      var ims = $scope.meta.intro.images;
      $scope.state.introimages = [];
      $scope.state.introimages[0] = ims[($scope.state.introimage+999*ims.length+1)%ims.length];
      $scope.state.introimages[1] = ims[($scope.state.introimage+999*ims.length)%ims.length];
      $scope.state.introimages[2] = ims[($scope.state.introimage+999*ims.length-1)%ims.length];
    };

    var scrollToup = function() {
      // window.scrollTo ... or ....
      document.getElementById("container").scrollTop = 0;
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
      if(lay == $scope.state.layout) return; // unchanged
      else {
        $scope.state.loading = true;

        // reset tags & search
        $scope.toggleTag();
        $scope.searchSubmit();

        $scope.state.layout = lay;
        if(lay!='links') {
          $scope.state.graphstatus = "NO";
          //loadLinksGraph($scope);
        }
        scrollToup();
        
        // update tag graph sizes
        //if($scope.state.tagsmode=='graph')
          updateTagNodesSizesForLayout($scope,lay);

        // unlock loader when scope ready (for map, only done after csv received)
        if(lay!='map')
          $timeout(function(){ $scope.state.loading = false; });
      }
    };

    $scope.loadLinksGraph = function() {
      loadLinksGraph($scope);
    };
    $scope.updateGraphSize = function() {
      $timeout(function() {
        updateGraphSize();
      },0)
    }


    $scope.tagSorter = function(tag) {
      var tc = tag.label ? tag : ($scope.tagsContents[tag] ? $scope.tagsContents[tag] : null);
      if(!tc) {
        console.log("error with tag:",tag);
        return -1;
      }
      var ic = tc.icon;
      if(!ic) return -1;
      else {
        if(tag=='about') return 6;
        if(tag=='list') return 5;
        if(tag=='place') return 4;
        return 1;
      }
    };
    $scope.overTag = function(tag,refresh) {
      if(tag && $scope.tagsContents[tag]) {
        $scope.state.overtag = $scope.tagsContents[tag];
      } else {
        $scope.state.overtag = {description: $scope.meta.menu.tagsdescription};
      }
      if(refresh) $scope.$apply();
    };

    $scope.isTagActive = function(tag) {
      return $scope.state.tags.indexOf(tag)!=-1;
    };



    $scope.toggleTagging = function() {
      $scope.state.tagging = !$scope.state.tagging;
      $scope.state.taggingtooltip = $scope.state.tagging ? 
        $scope.meta.menu.taggingon : $scope.meta.menu.taggingoff;
      $scope.toggleTag();
    };

    $scope.resetFilters = function() {
      $scope.toggleTag();
      $scope.searchSubmit();
      $scope.$apply();
    };


    var isElementShown = function(e) {
      var res = true;
      if($scope.state.search)
        res = $scope.shallShowSearch(e);
      if($scope.state.tags.length)
        res = res && $scope.shallShowTags(e);
      return res;
    };
    $scope.updateSearchTagCount = function() {
      $scope.state.count.sections = _.filter($scope.sectionsArray, function(e){
        return isElementShown(e);
      }).length;
      $scope.state.count.links = _.filter($scope.linksArray, function(e){
        return isElementShown(e);
      }).length;
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
      //if($scope.state.tagsmode=='graph')
        updateTagNodes($scope.state.tags);

      if($scope.state.graphstatus=="OK")
        filterLinksNodesFromTags($scope.state.tags);

      //$scope.updateSearchTagCount();

      if(refresh) $scope.$apply();
      scrollToup();
    };


    $scope.searchSubmit = function(term) {
      if(term) {
        $scope.state.search = term;
      }
      else {
        $scope.state.searchinput = "";
        $scope.state.search = "";
        $scope.toggleAllSections(false);
      }
      
      $scope.rgx.search = new RegExp($scope.state.search,'gi');

      if($scope.state.graphstatus=='OK')
        filterLinksNodes($scope.state.search);

      //$scope.updateSearchTagCount();

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
      if($scope.state.search)
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
    $scope.toggleAllSections = function(status) {
      _.each($scope.sectionsArray, function(p) {
        p.opened = status;
        if(status && !p.commentcount)
          $timeout(function() {
            updateCommentsCount(p);
          });
      });
    };


    $scope.md2Html = function(str) {
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
        if($scope.linksByTag[t])
          out = _.union(out, $scope.linksByTag[t]);
      });
      return out;
    }




    ///////////////////////////////////////////////////////////////
    $scope.fetchDataLinks = function() {
      $http
        .get(settings.datapath + "links_"+$scope.state.lang+".yml")
        .success(function(res) {

          var singlelink = res.split('\n\n');

          $scope.templinks4graph = [];

          _.each(singlelink, function(l) {

            var L = l.split('\n');

            var tgs = L[0].match(/\w+/ig);
            var isimportant = false;

            _.each(tgs, function(t) {
              if($scope.tagsContents[t] && $scope.tagsContents[t].important)
                isimportant = true;
            });

            // (test/dev) just to see links over graph
            if(tgs && tgs.length>2) {
              _.each(tgs, function(t1) {
                _.each(tgs, function(t2) {
                  if(t1!=t2)
                    $scope.templinks4graph.push([t1,t2]);
                });
              });
            }

            var htm = $scope.md2Html( L[1] );

            // store links as array
            $scope.linksArray.push({
              content: htm,
              tags: tgs,
              love: L[0][0]=="!",     // marked as special blend love like !
              important: isimportant  // if it has a least one tag marked as important
            });

            // store links indexed by tag (for taggraph sizes!)
            _.each(tgs, function(t) {
              if(!$scope.linksByTag[t]) $scope.linksByTag[t] = [];
              $scope.linksByTag[t].push(htm);
            });
          });

          if($scope.settings.verbose) {
            console.log("!! declared tags:",_.keys($scope.meta.tags));
            console.log("!! declared tags contents:",$scope.tagsContents);
            console.log("!! all links:",$scope.linksArray);
            console.log("!! nb of links by tag:",$scope.linksByTag);
            console.log("!! tags used in sections:",$scope.sectionNbByTag);
            console.log("!! non used in sections:", _.difference(_.keys($scope.linksByTag), _.keys($scope.sectionNbByTag)));
            console.log("!! non-declared tags:", _.difference(_.keys($scope.linksByTag), _.keys($scope.meta.tags)));
            console.log("!! declared tags with 0 link", _.difference(_.keys($scope.meta.tags), _.keys($scope.linksByTag)));
          }

          // populate links related to each section
          // _.each($scope.sections, function(p) {
          //   p.links = getLinksFromTags(p.tags);
          // });

        })
        .error(function (data, status, headers, config) {
          console.log("error links",status);
        });
    };

    ///////////////////////////////////////////////////////////////
    $scope.fetchDataSections = function(callb) {
    $http
      .get(settings.datapath + "sections_"+$scope.state.lang+".yml")
      .success(function(res) {

        jsyaml.loadAll(res, function(d) {

          //////////////////////////////////////////// PARSING META
          if(d.role && d.role=='meta') {

            $scope.meta = d;

            $scope.state.overtag = {description: $scope.meta.menu.tagsdescription};
            $scope.state.taggingtooltip = $scope.state.tagging ? 
              $scope.meta.menu.taggingon : $scope.meta.menu.taggingoff;


            // for html page meta
            $rootScope.htmlmeta = d.htmlmeta;

            // prepare splash images & their back color
            $scope.meta.intro.images = _.map($scope.meta.intro.images, function(v) {
              return {
                color: "#"+v.split("_")[1],
                filename: v + ".svg"
              };
            });
            $scope.state.introimages = [];
            $scope.state.introimages.push($scope.meta.intro.images[1]);
            $scope.state.introimages.push($scope.meta.intro.images[0]);
            $scope.state.introimages.push($scope.meta.intro.images[$scope.meta.intro.images.length-1]);

            _.each(d.tags, function(v,k) {
              var part = v.split(' = ');
              $scope.tagsContents[k] = {
                tag: k,
                label: part[0].split('|')[0].replace("_",""),
                description: part[1],
                icon: /^|/.test(part[0]) ? part[0].split('|')[1] : false,
                important: /_/.test(part[0]) ? true : false
              };
              $scope.tagsContentsOrdered.push($scope.tagsContents[k]);
            });

            // $scope.tagsContentsOrdered.sort(function(a,b) {
            //   return $scope.tagSorter(b) - $scope.tagSorter(a);
            // });
            

            //////////////////////////////////////////// PARSING SECTIONS
          } else { 

            //console.log(d);
            d.subtitle = $scope.md2Html(d.subtitle);
            d.subtitletext = totext(d.subtitle);
            if(d.quote) {
              d.quote.content = $scope.md2Html(d.quote.content);
              d.quote.author = $scope.md2Html(d.quote.author);
            }
            d.content = $scope.md2Html(d.content);
            d.tags = d.tags ? d.tags.split(', ') : [];
            _.each(d.tags, function(t) {
              $scope.sectionNbByTag[t] = $scope.sectionNbByTag[t] ? $scope.sectionNbByTag[t]+1 : 1;
            });
            d.links = $scope.md2Html(d.links);

            d.date = moment(d.date);
            var seuil = moment().subtract(3,"month");
            if(d.date > seuil)
              d.date = d.date.fromNow();
            else
              d.date = null;
            
            d.currentlink = 0;

            d.layout = 'flat'; //Math.random()<0.2 ? 'grid' : 'flat';

            $scope.sectionsArray.push(d);

          }
        });

        callb();
      })
      .error(function (data, status, headers, config) {
        console.log("error sections",status);
      });
    }


    ///////////////////////////////////////////////////////////////
    // fetch data
    $scope.fetchDataSections( function() {
      
      // fetch links
      $scope.fetchDataLinks();

      // load tag graph 
      $timeout(function() { loadTagGraph($scope); },500);

      // (to improve ?) init here to trigger the watch on footer content set though compile-html directive
      $scope.state.search = "";
    });


    // disqus
    (function() {
      var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
      dsq.src = '//manifestes.disqus.com/embed.js';
      (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
    })();
      

  }])

////////////////////////////////////////////////////////////////////////
.controller('MapController', [
  '$scope',
  '$http',
  '$timeout',
  '_',
  'settings',
  function ($scope, $http, $timeout, _, settings) {

    $scope.initMap = function() {

      console.log("initing map !");

      var osm = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });
      var cycle = L.tileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.opencyclemap.org/copyright">OpenCycleMap</a> contributors - &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      var terrain = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS'
      });
      var tileLayers = {
        "OSM": osm,
        "Cycle": cycle,
        //"Terrain": terrain
      };

      if(!settings.dev)
        L.Icon.Default.imagePath = "build/images";

      var map = L.map('leaflet', {
        zoomControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        center: [47, 2.5],
        zoom: 7,
        minZoom: 4,
        maxZoom: 15,
        locateButton: true,
        layers: [osm]
      });

      L.control.zoom({
        position: 'topleft', //'bottomleft'
      }).addTo(map);

      L.control.locate({
        position: 'topleft', //'bottomleft',
        icon: 'fa fa-street-view',
        showPopup: false,
      }).addTo(map);
      var layers = new L.LayerGroup().addTo(map);

      $http.get(settings.datapath + '/map.csv').success(function(data) {
        //console.log("got csv data:",data);
        //$scope.data = data;
        var ms = new CSV(data, {header:true, cast:false}).parse();
        
        $scope.points = ms;
        
        _.each(ms, function(m,k) {

          // if(!layers[m.source]) {
          //   layers[m.source] = new L.LayerGroup().addTo(overlays);
          // }

          // I want hue !
          // #477D50
          // #CC5B79
          // #6779AB
          // #C06538
          // #766859
          // #856D2D
          // #8F5D83
          // #4A787E
          // #63862A
          // #985249

          var credit = $scope.meta.mapcredits[m.source.split('_')[0]];
          //console.log(credit);

          var icon = 'circle';
          var color = "#"+credit.color || "#000";
          var size = "s";

          if(/region/.test(m.scale)) {
            size = "m";
            icon = "land-use";
          }
          if(/city/.test(m.scale)) {
            size = "s";
            icon = "circle-stroked";
          }
          if(/zone/.test(m.scale)) {
            size = "s";
            icon = "circle-stroked";
          }

          //var customPopup = "<div ng-include ng-init=\"data=leafmarkers['"+m.source+"']['mark_"+k+"'];\" src=\"'partials/marker.html'\"></div>";
          var customPopup = "<div class='details'>"+
            "<h3>"+m.name+"</h3>"+
            "<div class='address'>"+m.address+"</div>"+
            "<div>"+m.description+"</div>"+
            //"<div class='contact'>"+m.contact+"</div>"+
            //"<div class='source'>source: "+credit.name+" - "+credit.url+"</div>"+
          "</div>";
          var customOptions = {
            'maxWidth': '500',
            'className' : 'custom'
          }
          m.lat = parseFloat(m.lat);
          m.lng = parseFloat(m.lng);
          if(m.lat && m.lng) {
            var theM = L.marker([m.lat, m.lng], {
              title: m.name,
              icon: L.MakiMarkers.icon({
                icon: icon,
                color: color,
                size: size
              })
            })
            .bindPopup(customPopup,customOptions)
            .addTo(layers);
          } else {
            if($scope.settings.verbose)
              console.log("!! no lat/lng for:",m);
          }
        });
        
        if($scope.settings.verbose)
          console.log("all markers added!");

        var layerControl = L.control.layers(null, tileLayers, {position: 'topleft'});
        layerControl.addTo(map);
        
        //console.log("overlays !!",layers);

        L.control.search({
          layer: layers,
          initial: false,
          zoom: 9,
          buildTip: function(text, val) {
            var type = "ok";
            return '<div><a href="#" class="'+type+'">YOU'+text+'<b>'+type+'</b></a></div>';
          }
        }).addTo(map);

        // when ready, remove loading
        $timeout(function(){ $scope.state.loading = false; });

      }).error(function(err) {

        console.log(err);

      });
    }

  }
])
  