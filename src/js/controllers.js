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

    console.log("from controller:",settings);

    $scope.settings = settings;
    
    var layout = $routeParams.layout ?
      (["home","sections","sectionsprint","links","network","map","mapprint"].indexOf($routeParams.layout)==-1 ? "sections" : $routeParams.layout) :
      "home";
    var tags = [];
    //var tags = $routeParams.tags ? $routeParams.tags.split(',') : [];
    var intro = !$routeParams.layout;

    $scope.meta = {}; // mainly the meta info at start of section.yml
    $scope.sectionArray = []; // full list of sections
    $scope.sectionFiltArray = []; // displayed list of sections
    $scope.linkArray = []; // full list of links
    $scope.linkFiltArray = []; // displayed list of links

    $scope.tagsContents = {}; // .tag .label .description .icon for each tag
    $scope.tagsContentsOrdered = []; // same but array to be able to sort
    
    $scope.linksByTag = {}; // links by tag
    $scope.sectionNbByTag = {}; // sections by tag (only nb)
    
    $scope.settings.verbose = false; // to print detailed stats on tags, objects, etc...

    $scope.state = {
      intro: intro, // splash fullscreen panel
      introimage: 0, // slideshow of intro splash images
      lang: $routeParams.lang,
      layout: layout, // sections/links/map/print/etc...
      loading: false, // we will show loadingspinner when scope not ready

      disclaim: {
        sections: !$scope.settings.dev,
        links: !$scope.settings.dev,
        network: !$scope.settings.dev,
        map: !$scope.settings.dev,
      },

      count: {}, // will count results if search/tags filtered

      tagging: tags.length>0, // if tags/filtering active or not
      tagsmode: 'grid', // tags display mode: graph OR grid
      tagspanel: false,
      tags: tags, // list of current filtering tags

      togglesections: null, // wil be 'up' or 'down' to display arrows to open/close all sections

      networkstatus: "NO", // loaded or not ?

      mapSources: []
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

    $scope.updatePath = function() {
      var st = $scope.state;
      $location.path('/'+st.lang+'/'+st.layout, false); //+'/'+st.tags.join(','), false);
    }


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
      if($scope.state.introimage < 0)
        $scope.state.introimage = 0;
      if($scope.state.introimage > $scope.meta.splash.images.length-1)
        $scope.state.introimage = $scope.meta.splash.images.length-1;
    };

    var scrollToup = function() {
      // window.scrollTo ... or ....
      document.getElementById("container").scrollTop = 0;
    };
    
    $scope.getRandomInt = function() {
      return Math.floor((Math.random()*7));
    };


    $scope.changeLayout = function(lay) {
      if(lay == $scope.state.layout) return; // unchanged
      else {

        $scope.state.loading = true;

        // reset tags & search
        //$scope.toggleTag();
        //$scope.searchSubmit();

        $scope.state.layout = lay;
        // if(lay!='network') {
        //   $scope.state.networkstatus = "NO";
        //   //loadLinksGraph($scope);
        // }

        //scrollToup();
        
        // update tag graph sizes
        //if($scope.state.tagsmode=='graph')
          //updateTagNodesSizesForLayout($scope,lay);

        // unlock loader when scope ready (for map, only done after csv received)
        if(lay!='map')
          $timeout(function(){ $scope.state.loading = false; });

        $scope.updatePath();

      }
    };

    $scope.networkControl = function(what) {
      controlLinksGraph(what);
    };


    $scope.tagSorter = function(tag) {
      var tc = tag.label ? tag : ($scope.tagsContents[tag] ? $scope.tagsContents[tag] : null);
      if(!tc) {
        //console.log("no sort for tag:",tag);
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

    $scope.isTagActive = function(tagslug) {
      return $scope.state.tags.indexOf(tagslug)!=-1;
    };
    $scope.isTagAutoComplete = function(tag) {
      if($scope.state.searchinput && $scope.state.searchinput.length>2) {
        return (tag.label+" "+tag.description).indexOf($scope.state.searchinput)!=-1;
      } else
        return false;
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
      $scope.state.count.sections = _.filter($scope.sectionArray, function(e){
        return isElementShown(e);
      }).length;
      $scope.state.count.links = _.filter($scope.linkArray, function(e){
        return isElementShown(e);
      }).length;
    };

    $scope.toggleTag = function(tag,refresh) {

      // please set max tags to 5 ! (?)

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
      
      scrollToup();

      // update graph node colors
      //if($scope.state.tagsmode=='graph')
        //updateTagNodes($scope.state.tags);

      updateArrays();

      if($scope.state.networkstatus=="OK")
        filterLinksNodesFromTags($scope.state.tags);

      //$scope.updateSearchTagCount();

      if(refresh) $scope.$apply();
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
      
      $scope.rgx.search = new RegExp($scope.state.search,'i');

      updateArrays();

      if($scope.state.networkstatus=='OK')
        filterLinksNodesFromTerm($scope.state.search);

      //$scope.updateSearchTagCount();

      scrollToup();
    };

    
    $scope.rgx = {};
    $scope.rgx.inlnk = new RegExp("<[^>]*>","gi");
    $scope.rgx.search = new RegExp("",'i'); // is updated after each keystroke on search input
    var totext = function(htm) {
      return htm.replace(/<[^>]+>/gm,'');
    };


    var shallShowSearch = function(o) { // "o" is a section or a link
      var reg = $scope.rgx.search;
      if($scope.state.search)
      if(o.title) { // a section
        var show = o.hasOwnProperty('quote') && reg.test(totext(o.quote.content));
        _.each(['title','subtitle','content'], function(k) {
          show = show || ( o.hasOwnProperty(k) && reg.test(totext(o[k])) );
        });
      } else { // a link
        var show = reg.test(totext(o.content));
      }
      return show;
    };
    var shallShowTags = function(o,onlyintersect) { // "o" is a section or a link
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

    var updateArrays = function() {
      console.log("updateArrays!");

      if(!$scope.state.search && !$scope.state.tags.length) {
        $scope.sectionFiltArray = $scope.sectionArray;
        $scope.linkFiltArray = $scope.linkArray;
      } else {

        if($scope.state.layout=="sections")
          $scope.sectionFiltArray = _.filter($scope.sectionArray, function(e) {
            return ($scope.state.search && shallShowSearch(e)) || ($scope.state.tags.length && shallShowTags(e,false));
          });


        if($scope.state.layout=="links")
          $scope.linkFiltArray = _.filter($scope.linkArray, function(e) {
            return ($scope.state.search && shallShowSearch(e)) || ($scope.state.tags.length && shallShowTags(e,false));
          });
      }
      //$scope.$apply();
    };


    $scope.highlight = function(html) {
      var out = "";
      if(!$scope.state.search || $scope.state.search.length<3) {

        out = $sce.trustAsHtml(html);

      } else {
        
        var rgxp = $scope.rgx.search;

        var text = totext(html);

        if(!rgxp.test(text)) { // if flattened html don't matches

          out = $sce.trustAsHtml(html);

        } else {

          var inlnkmatches = html.match($scope.rgx.inlnk);

          // if at least one link rawtag matches, highlight all
          if(inlnkmatches && rgxp.test( inlnkmatches.join("") )) {

            out = $sce.trustAsHtml('<div class="highlight">'+html+'</div>');

          } else {

            if( !rgxp.test(html) ) { // (never ?) if html don't match, but flattened text matches, higlight all
              out = $sce.trustAsHtml('<div class="highlight">'+html+'</div>');
            } else {
              var globreg = new RegExp($scope.state.search,'gi');
              out = $sce.trustAsHtml(html.replace(globreg,'<span class="highlight">$&</span>'));
            }

          }

        }
      }
      return out;
    };


    $scope.toggleOne = function(p) {
      p.opened = !p.opened ;
    };
    $scope.toggleAllSections = function(status) {
      _.each($scope.sectionArray, function(p) {
        p.opened = status;
      });
    };


    $scope.md2Html = function(str) {
      return str ? markdown.toHTML(str) : "";
    };

    var getLinksFromTags = function(tags) {
      var out = [];
      _.each(tags, function(t) {
        if($scope.linksByTag[t])
          out = _.union(out, $scope.linksByTag[t]);
      });
      return out;
    };



    ///////////////////////////////////////////////////////////////
    var fetchDataMeta = function(callb) {
      $http
      .get(settings.datapath + "meta_"+$scope.state.lang+".yml")
      .success(function(res) {

        var m = jsyaml.load(res);
        $scope.meta = m;

        $scope.state.overtag = {description: m.menu.tagsdescription};
        $scope.state.taggingtooltip = $scope.state.tagging ? 
          m.menu.taggingon : m.menu.taggingoff;


        // for html page meta
        $rootScope.htmlmeta = m.htmlmeta;

        // prepare splash images & their back color
        $scope.meta.splash.images = _.map(m.splash.images, function(v) {
          return {
            color: /_/.test(v) ? "#"+v.split("_")[1].split('.')[0] : "#000",
            filename: v,
            full: !/_/.test(v)
          };
        });

        _.each(m.tags, function(v,k) {
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

        _.each($scope.meta.mapcredits, function(c) {
          c.active = true;
          c.count = 0;
        });

        // $scope.tagsContentsOrdered.sort(function(a,b) {
        //   return $scope.tagSorter(b) - $scope.tagSorter(a);
        // });
      
        callb();
      })
      .error(function (data, status, headers, config) {
        console.log("error meta",status);
      });
    };


    ///////////////////////////////////////////////////////////////
    var fetchDataSections = function(callb) {
      $http
      .get(settings.datapath + "sections_"+$scope.state.lang+".yml")
      .success(function(res) {

        jsyaml.loadAll(res, function(d) {

          //console.log(d);
          //d.subtitle = $scope.md2Html(d.subtitle);
          if(d.subtitle) d.subtitletext = totext(d.subtitle);
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

          $scope.sectionArray.push(d);
        });
        $scope.sectionFiltArray = $scope.sectionArray;
        callb();
      })
      .error(function (data, status, headers, config) {
        console.log("error sections",status);
      });
    };


    ///////////////////////////////////////////////////////////////
    var fetchDataLinks = function() {
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
          $scope.linkArray.push({
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
        
        $scope.linkFiltArray = $scope.linkArray;
  

        if($scope.settings.verbose) {
          console.log("!! declared tags:",_.keys($scope.meta.tags));
          console.log("!! declared tags contents:",$scope.tagsContents);
          console.log("!! all links:",$scope.linkArray);
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
        
        // inject some random images ?
        /*$http
          .get(settings.datapath + "expo.json")
          .success(function(data) {
            //console.log(data);
            var N = $scope.linkArray.length-1;
            _.each(data, function(v,k) {
              var im = {
                name: k,
                image: settings.datapath + "expo/" + v
              };
              console.log(im);
              $scope.linkArray.splice(N*Math.random(), 0, im);
            });
          })
          .error(function (data, status, headers, config) {
            console.log("error expo",status);
          });*/

      })
      .error(function (data, status, headers, config) {
        console.log("error links",status);
      });
    };


    ///////////////////////////////////////////////////////////////
    fetchDataMeta( function() {

      // fetch data
      fetchDataSections( function() {
        
        // fetch links
        fetchDataLinks();

        // load graphs ?
        $timeout(function() {
          //loadTagGraph($scope);
          if($scope.state.layout=='network')
            loadLinksGraph($scope);
        },500);

        // (to improve ?) init here to trigger the watch on footer content set though compile-here directive
        $scope.state.search = "";

      });
    });

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
        minZoom: 5,
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

          var credit = _.findWhere($scope.meta.mapcredits, {slug: m.source});
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
            "<div class='descr'>"+m.description+"</div>"+
            "<div class='web'>"+m.web+"</div>"+
            "<div class='contact'>"+m.contact+"</div>"+
          "</div>";
          var customOptions = {
            'maxWidth': '500',
            'className' : 'custom'
          }
          m.lat = parseFloat(m.lat);
          m.lng = parseFloat(m.lng);
          if(m.lat && m.lng) {

            // store total count to display stats
            credit.count += 1;

            var css = "src-"+m.source+" t-"+m.tags.replace(/ /g," t-");

            var theM = L.marker([m.lat, m.lng], {
              title: m.name,
              icon: L.MakiMarkers.icon({
                icon: icon,
                color: color,
                size: size,
                className: css
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

      //////////////////////
      $scope.toggleMapLegend = function(c) {
        console.log("Toggling:",c);

        var isFull = _.findIndex($scope.meta.mapcredits, {active: false})==-1;
        if(isFull) _.each($scope.meta.mapcredits, function(e) {
          e.active = false;
        });
        
        c.active = !c.active;

        var isEmpty = _.findIndex($scope.meta.mapcredits, {active: true})==-1;
        if(isEmpty) _.each($scope.meta.mapcredits, function(e) {
          e.active = true;
        });

        $scope.state.mapStyles = _.map($scope.meta.mapcredits, function(e) {
          var act = e.active ? "block" : "none";
          return ".src-"+e.slug+ "{ display: "+act+"; }";
        }).join(" ");
      };
    }

  }
])
  