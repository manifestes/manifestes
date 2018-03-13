'use strict';

angular.module('manifest.maincontroller', ['underscore','settings'])
////////////////////////////////////////////////////////////////////////
.controller('MainController', [
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

    console.log("Controller:",settings);

    $scope.settings = settings;
    $scope.settings.smallDevice = $window.innerWidth < 1025;

    // what is the current layout ?
    
    var intro = !$routeParams.layout;

    var layout = $routeParams.layout ?
      (settings.layouts.indexOf($routeParams.layout)==-1 ? "home" : $routeParams.layout)
      : "home";

    var tags = [];
    //var tags = $routeParams.tags ? $routeParams.tags.split(',') : [];

    $scope.meta = {}; // mainly the meta info at start of text.yml

    $scope.dataArray = { // full list 
      abcd: [],
      pixels: [],
      books: [],
      catalog: []
    }
    $scope.dataArrayFilt = { // displayed list
      abcd: [],
      pixels: [],
      books: [],
      catalog: []
    }
    
    $scope.settings.verbose = false; // to print detailed stats on tags, objects, etc...

    $scope.state = {
      intro: intro, // splash fullscreen panel
      introimage: 0, // slideshow of intro splash images
      lang: 'fr', // olderly: $routeParams.lang,
      layout: layout, // abcd/links/map/print/etc...
      loading: false, // we will show loadingspinner when scope not ready
      
      // always hide for dev. starting open for prod
      disclaim: {
        abcd: !$scope.settings.dev,
        links: !$scope.settings.dev,
        pixels: !$scope.settings.dev,
        books: !$scope.settings.dev,
        network: !$scope.settings.dev,
        map: !$scope.settings.dev,
      },

      suggestions: {}, // search suggestions based on freqs

      count: {}, // will count results if search/tags filtered

      tagging: tags.length>0, // if tags/filtering active or not
      tagspanel: false,
      tags: tags, // [] of current filtering tags
      hoverTags: [], // from hovered abcd section

      prevSearchLen: 0, // ...see how live searching works
      networkstatus: "NO", // loaded or not ?

      mapSources: [],

      ninja: {
        input: "",
        in: {min:0,max:0,MAX:0},
        out: {min:0,max:0,MAX:0},
        count: 0,
        intro: true,
        settings: false
      }
    };
    
    if($scope.settings.verbose)
      console.log("state:",$scope.state);

    $scope.updatePath = function() {
      var st = $scope.state;
      $location.path('/'+st.layout, false); //+'/'+st.tags.join(','), false);
    }

    $scope.partialTemplate = function(lay) {
      if(!lay)
        return $scope.settings.assets+'partials/layout_'+$scope.state.layout+'.html';
      else
        return $scope.settings.assets+'partials/'+lay+'.html';
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
        $scope.state.pad = $scope.meta.menu.pad[lay];

        $scope.state.layout = lay;

        $scope.updatePath();

      }
    };

    $scope.networkControl = function(what) {
      controlLinksGraph(what);
    };

    $scope.overSection = function(e) {
      $scope.state.hoverTags = e.tags;
      console.log($scope.state.hoverTags);
    };

    $scope.isTagActive = function(t) {
      return $scope.state.tags.indexOf(t.tag)!=-1;
    };
    $scope.isTagFromHoveredSection = function(t) {
      return $scope.state.hoverTags.indexOf(t.tag)!=-1;
    };
    $scope.isTagAutoComplete = function(t) {
      if($scope.state.searchinput && $scope.state.searchinput.length>2) {
        return (t.tag+" "+t.keywordsjoined).indexOf($scope.state.searchinput)!=-1;
      } else
        return false;
    };
    $scope.tagHint = function(t) {
      if($scope.isTagAutoComplete(t)) {
        var ws = [];
        _.each(t.keywords, function(k) {
          if(k.indexOf($scope.state.searchinput)!=-1)
            ws.push(k);
        });
        return ws.join(", ");
      } else {
        return t.moto;
      }
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
      $scope.state.count.texts = _.filter($scope.dataArray.texts, function(e){
        return isElementShown(e);
      }).length;
      $scope.state.count.links = _.filter($scope.dataArray.links, function(e){
        return isElementShown(e);
      }).length;
    };

    $scope.toggleTag = function(tag,refresh) {

      // erase searchterm if exist
      if(tag) $scope.searchSubmit("",true);

      // please set max tags to 5 ! (?)

      if(!tag)
        $scope.state.tags = [];
      else {
        if($scope.state.tags) {
          if($scope.state.tags[0]==tag)
            $scope.state.tags = [];
          else
            $scope.state.tags = [tag];
        } else {
          $scope.state.tags = [tag];
        }
      }
      console.log("state tags:",$scope.state.tags);
      
      scrollToup();

      updateArrays();

      if($scope.state.networkstatus=="OK")
        filterLinksNodesFromTags($scope.state.tags);

      //$scope.updateSearchTagCount();

      if(refresh) $scope.$apply();
    };


    $scope.searchSubmit = function(term,dontdetag) {
      if(!term) {
        $scope.state.searchinput = "";
        $scope.state.search = "";
        if(!dontdetag) $scope.state.tagging = false;
      }
      if(term && term.length < $scope.prevSearchLen || term.length>1) {
        if(term) {
          $scope.state.search = term;
          $scope.prevSearchLen = term.length;
          $scope.state.tagging = true;
        }
        
        $scope.rgx.search = new RegExp($scope.state.search,'i');

        updateArrays();

        if($scope.state.networkstatus=='OK')
          filterLinksNodesFromTerm($scope.state.search);

        scrollToup();
      }
    };

    
    $scope.rgx = {};
    $scope.rgx.inlnk = new RegExp("<[^>]*>","gi");
    $scope.rgx.search = new RegExp("",'i'); // is updated after each keystroke on search input

    var shallShowSearch = function(o) { // "o" is a text or a link
      var reg = $scope.rgx.search;
      if($scope.state.search)
      if(o.content) { // an abcd ! (text,link,quote)
        var show = false;
        _.each(['source','content','title'], function(k) {
          show = show || ( o.hasOwnProperty(k) && reg.test(totext(o[k])) );
        });
      } else { // ... if no content, then ...
        if(o.name) { // a book
          var show = reg.test(totext(o.name));
        } 
        else // an image !
          var show = reg.test(totext(o.label));
      }
      return show;
    };

    var shallShowTags = function(o,onlyintersect) { // "o" is an "abcd"
      if($scope.state.tags.length && o.tags) {
        var interslen = _.intersection(o.tags,$scope.state.tags).length;
        if(onlyintersect) { // return striclty those who has exactly ?
          return interslen == $scope.state.tags.length;
        }
        else { //
          return interslen > 0;
        }
      } else
        return true;
    }

    var updateArrays = function() {
      console.log("updateArrays!");
      var lay = $scope.state.layout;
      if(["abcd","pixels","books"].indexOf(lay)!==-1) {

        if(!$scope.state.search && !$scope.state.tags.length) { // if no search no tag
          $scope.dataArrayFilt[lay] = $scope.dataArray[lay];
        } else {
          $scope.dataArrayFilt[lay] = _.filter($scope.dataArray[lay], function(e) {
            return ($scope.state.search && shallShowSearch(e)) || ($scope.state.tags.length && shallShowTags(e,false));
          });
        }
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


    $scope.subscribeList = function(email) {
      $http
      .post("https://lists.riseup.net/www", {
        email: email,
        list: "manifestes",
        action: "subrequest"
      })
      .success(function(res) {
        console.log(res);
      })
      .error(function (data, status, headers, config) {
        console.log("error mailing",data,status,headers,config);
      });
    }


    ///////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////
    var fetchAndPopulateData = function(which, callb) {

      /////////////////////////////////////
      if(which=='network') {
        $timeout(function() {
          //loadTagGraph($scope);
          loadLinksGraph($scope);
        },500);
      }

      /////////////////////////////////////
      if(which=='ninja') {
        initNinja();
      }

      /////////////////////////////////////
      if(which=='catalogprint') {
        fetchAndPopulateData('catalog', function() {
          // randomly place contents into page layouts
          prepairCatalogLayouts();
        });
      }

      ///////////////////////////////////// YML DATA
      if(["meta","abcd","links","pixels","books","catalog","map"].indexOf(which)!==-1) {

        var filename = which;
        if(which=="pixels")
          filename = "pixels.json";
        else 
          filename = which+".yml";

        $http
        .get(settings.datapath + filename)
        .success(function(res) {

          ////////////////////////////////////
          if(which=="meta") {
            var m = jsyaml.load(res);
            $scope.meta = m;

            $scope.state.taggingtooltip = $scope.state.tagging ? 
              m.menu.taggingon : m.menu.taggingoff;

            // for html page meta
            $rootScope.htmlmeta = m.htmlmeta;

            // tags
            var ii = 0;
            $scope.tags = {};
            _.each(m.tags, function(v,k) {
              $scope.tags[k] = {
                tag: k,
                index: ii++,
                icon: v[0],
                moto: v[1], // default popup display
                keywords: v[2].split(","), // list of searchable words, popuped when searched
                keywordsjoined : v[2]
              };
            });
            //console.log($scope.tags);
            $scope.tagsArray = _.map($scope.tags);
            //console.log(tco);

            // prepare splash images & their back color
            $scope.meta.splash.images = _.map(m.splash.images, function(v) {
              return {
                color: /_/.test(v) ? "#"+v.split("_")[1].split('.')[0] : "#000",
                filename: v,
                full: !/_/.test(v)
              };
            });

            $scope.state.pad = $scope.meta.menu.hasOwnProperty('pad') ?
              $scope.meta.menu.pad[$scope.state.layout] : "";
          }
          
          ////////////////////////////////////
          if(which=="abcd") {
            var ttcount = {};
            jsyaml.loadAll(res, function(d) {

              d.content = $scope.md2Html(d.content);
              d.tags = d.tags ? d.tags.split(' ') : ["nc"];
              d.sharelink = "http://utopies-concretes.org/slug/"+slugify(d.title);

              $scope.dataArray.abcd.push(d);

            });

            //console.log("ABCD:",$scope.dataArray.abcd.length);
            $scope.dataArray.abcd = _.shuffle($scope.dataArray.abcd);
            $scope.dataArrayFilt.abcd = $scope.dataArray.abcd;
          }

          ////////////////////////////////////
          if(which=="pixels") {
            // determine most frequent words to help search
            var words = _.keys(res).join().split(/[\,\-_]/);
            $scope.state.suggestions.pixels =
              _.chain(words)
              .countBy()
              .pairs()
              .sortBy(function(item) {return item[1];})
              .last(30)
              .map(function(e){return e[0];})
              .without("","l","i","pas","le","les","vous","de","you","autre")
              .value();
            //console.log($scope.state.suggestions.pixels);

            _.each(res, function(v,k) {
              $scope.dataArray.pixels.push({
                label: k,
                url: settings.datapath + "pixels/" + v
              });
            });
            $scope.dataArray.pixels = _.shuffle($scope.dataArray.pixels);
            $scope.dataArrayFilt.pixels = $scope.dataArray.pixels;
          }

          ////////////////////////////////////
          if(which=="books") {
            //console.log(res);
            var line = res.split('\n');

            _.each(line, function(l) {
              var d = l.split(" "); // name url
              var tagged = (/,/).test(d[0]); // seems always to be: tag.tag.tag,author_name-of-book.pdf
              $scope.dataArray[which].push({
                url: d[1],
                tags: tagged ? d[0].split(",")[0].split('.') : [],
                tag: tagged ? d[0].split(",")[0].split('.')[0] : "",
                name: tagged ? d[0].split(",")[1] : d[0]
              });
            });
            $scope.dataArrayFilt[which] = $scope.dataArray[which];
          }

          ////////////////////////////////////
          if(which=="map") {
            var mapset = jsyaml.load(res);
            $scope.meta = _.extend($scope.meta, mapset);

            // prepare map credits
            _.each($scope.meta.mapcredits, function(c) {
              c.active = false;
              c.loaded = false;
              c.count = 0;
            });
            $scope.meta.mapcreditsOf = {};
            _.each($scope.meta.mapcredits, function(c) {
              $scope.meta.mapcreditsOf[c.slug] = c;
            });

            
            createLeaflet();

            // now FETCH data (only of big screen)
            if(!$scope.settings.smallDevice) {

              var credits = _.filter($scope.meta.mapcredits, function(c) {
                return !c.hide;
              });
              async.parallel(

                _.map(credits, function(c) {
                  return function(callb) { loadCredit(c,callb); };
                })
                , function(err,results) {

                console.log("All map data fetchs done. Bravo.");

                buildSearchControl();
                updateMapStyles();

              });

            } else {
              console.log("Not loading map data 'cause small screen");
            }
          }

          ////////////////////////////////////
          ////////////////////////////////////
          if(callb) callb();
        })
        .error(function (data, status, headers, config) {
          console.log("error loading:"+which,status);
        });
      }

    };

    ///////////////////////////////////////////////////////////////
    var prepairCatalogLayouts = function() {
      // designed layouts are called based on nb of elements they use
      var layouts = ["2img,1text","1quote"];
      var tobeput = $scope.dataArray.catalog;
      $scope.pagesArray = [];
      console.log("Start catalog loop");

      // prepair separated lists of elmts
      var preplists = {};
      // for each type..
      _.each(['t','q','l','i','u','m'], function(t) {
        // ..make a filteredlist
        preplists[t] = _.filter($scope.dataArray.catalog, function(r) {
          // is type if has this 'letter' key
          return r[t];
        });
      });

      while($scope.pagesArray.length<30) {
        var p = {};
        var lay = _.sample(layouts);
        console.log("Choosing another random layout:",lay);
        var elstofind = lay.split(",");
        
        _.each(elstofind, function(e) {
          e = {
            t: e[1], // type is one letter (t,l,i,...)
            howmany: e[0]
          };

          //look into what's left in the prepaired list of this elmt type
          var found = _.sample(preplists[e.t], e.howmany);
          // if no, forget this layout !
          if(!found) {
            layouts = _.without(layouts,lay);
            console.log("No more elements to fill layout:", lay);
          }

          //console.log("Found:",found,e);
          if(!found) {
            console.log("! Not anymore enough types of this element:",e.t,"in",lay);
            return;
          } else {
            p[e.t] = found;
            // remove those elements from stack
            _.without(preplists[e.t], found);
          }
        });

        $scope.pagesArray.push(p);
        console.log("Page made:",$scope.pagesArray.length);
      };
    };

    ///////////////////////////////////////////////////////////////
    ////////////////////// MAP !! /////////////////////////////////
    ///////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////
    $scope.mapJumpTo = function(c) {
      c.pos = c.pos.split(',');
      $scope.map.setView(c.pos,c.zoom);
    };

    ///////////////////////////////////////////////////////////////
    var updateMapStyles = function() {
      $scope.state.mapStyles = _.map($scope.meta.mapcredits, function(e) {
        var act = e.active ? "block" : "none";
        var css = 
          ".markdiv-"+e.color+" {background: #"+e.color+";} " +
          ".src-"+e.slug+" { display: "+act+"; }";
        return css;
      }).join(" ");
    };

    // $scope.activeCount = function() {
    //   return _.filter($scope.meta.mapcredits, function(c) {
    //     return c.active;
    //   }).length;
    // };

    ///////////////////////////////////////////////////////////////
    var createLeaflet = function() {

      console.log("Creating Leaflet !");

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
      var OpenTopoMap = L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
      });
      var Thunderforest_TransportDark = L.tileLayer('http://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      });
      var Thunderforest_Pioneer = L.tileLayer('http://{s}.tile.thunderforest.com/pioneer/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });
      var MapQuestOpen_Aerial = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}', {
        type: 'sat',
        ext: 'jpg',
        attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency',
        subdomains: '1234'
      });
      var Stamen_TonerLite = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png'
      });
      var Esri_NatGeoWorldMap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
        maxZoom: 16
      });
      var CartoDB_Positron = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
      });
      var CartoDB_DarkMatter = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
      });
      var HikeBike_HillShading = L.tileLayer('http://{s}.tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png', {
        maxZoom: 15,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });
      var tileLayers = {
        "Positron": CartoDB_Positron,
        "DarkMatter": CartoDB_DarkMatter,
        "OSM Grey": osm,
        "Cycle": cycle,
        "Topographic": OpenTopoMap,
        "TransportDark": Thunderforest_TransportDark,
        "Light B&W": Stamen_TonerLite,
        "Natural Geo": Esri_NatGeoWorldMap,
        "OldStyle": Thunderforest_Pioneer,
        "Terrain noLabel": terrain,
        "Relief noLabel": HikeBike_HillShading,
        "Satellite": MapQuestOpen_Aerial
      };

      if(!settings.dev)
        L.Icon.Default.imagePath = "build/images";

      // recurrent error: Map container already initialized ?
      // seems controllers are loaded 2 times ! weird..
      // if($scope.map) 
      //   $scope.map.remove();

      $('#leaflet').html('');

      $scope.map = L.map('leaflet', {
        zoomControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        center: [47, 2.5],
        zoom: 6,
        minZoom: 5,
        maxZoom: 15,
        locateButton: true,
        layers: [CartoDB_Positron]
      });

      L.control.zoom({
        position: 'topleft', //'bottomleft'
      }).addTo($scope.map);

      L.control.locate({
        position: 'topleft', //'bottomleft',
        icon: 'fa fa-street-view',
        showPopup: false,
      }).addTo($scope.map);

      $scope.layers = new L.LayerGroup().addTo($scope.map);

      var layerControl = L.control.layers(tileLayers, null, {position: 'topleft'});
      layerControl.addTo($scope.map);

    };

    ///////////////////////////////////////////////////////////////
    // business to add a point
    var addMarker = function(m,credit) {
      var credit = $scope.meta.mapcreditsOf['misc'];
      if($scope.meta.mapcreditsOf.hasOwnProperty(m.source))
        credit = $scope.meta.mapcreditsOf[m.source];
        
      if(!m.name) m.name = " "; // warning not to crash the leaflet-search !

      // MakiMarkers !
      var icon = 'circle';
      //var color = "#"+credit.color || "#000";
      var size = $scope.settings.smallDevice ? [15,15] : [9,9];
      // icons use maki-markers: https://www.mapbox.com/maki/
      if(/region/.test(m.scale)) {
        size = $scope.settings.smallDevice ? [17,17] : [11,11];
        //icon = "land-use";
      }
      if(/city/.test(m.scale)) {
        //size = [12,12];
        //icon = "circle-stroked";
      }
      if(/zone/.test(m.scale)) {
        //size = [10,10];
        //icon = "circle-stroked";
      }
      if(/human/.test(m.tags)) {
        //size = "s";
        //icon = "heart";
      }
      if(/list/.test(m.tags)) {
        size = $scope.settings.smallDevice ? [19,19] : [15,15];
      }


      //var customPopup = "<div ng-include ng-init=\"data=leafmarkers['"+m.source+"']['mark_"+k+"'];\" src=\"'partials/marker.html'\"></div>";
      var customPopup = "<div class='details'>"+
        "<h3>"+m.name+"</h3>";
      if(m.address)
        customPopup += "<div class='address'>"+m.address+"</div>";
      if(m.description)
        customPopup += "<div class='descr'>"+m.description+"</div>";
      if(m.web) {
        customPopup += "<div class='web'>"+replaceURLWithHTMLLinks(m.web)+"</div>";
      }
      if(m.contact)
        customPopup += "<div class='contact'>"+m.contact+"</div>";
      customPopup += "<div class='source'>— "+m.source+"</div></div>";

      var customOptions = {
        'maxWidth': '470',
        'className' : 'custom'
      }
      m.credit = credit;
      m.lat = parseFloat(m.lat);
      m.lng = parseFloat(m.lng);
      if(m.lat && m.lng) {

        // store total count to display counts within legend
        credit.count += 1;

        var css =
          "markdiv"+
          " markdiv-"+credit.color;
        if(m.source)
          css += " src-"+m.source;
        if(m.tags)
          css += " t-"+m.tags.replace(/ /g," t-");
          
        var theM = L.marker([m.lat, m.lng], {
          title: m.name,
          raw: _.pick(m,['description','address','credit']),
          icon: new L.DivIcon({
            iconSize: size,
            className: css 
          })
          /*icon: L.MakiMarkers.icon({
            icon: icon,
            color: color,
            size: size,
            className: css
          })*/
        })
        .bindPopup(customPopup,customOptions)
        .addTo($scope.layers);
      } else {
        if($scope.settings.verbose)
          console.log("!! no lat/lng for:",m);
      }
    };
    

    ///////////////////////////////////////////////////////////////
    var do_demosphere = function(c,callback) {
      console.log("Fetch demosphere:",c.slug,c);
      c.loading = true;

      // prepairing common parameters
      var params = {
        startTime: parseInt(moment().valueOf()/1000),
        endTime: parseInt(moment().add(4,'days').valueOf()/1000),
        place__latitude: true,
        place__longitude: true,
        //place__zoom: true,
        //topics: true,
        url: true,
        //limit: 10,
        //random: 0.4987987
      };
      var str = "";
      for(var key in params) {
        if(str!="") str+="&";
        str += key+"="+params[key];//encodeURIComponent(p[key]);
      }
      var flatparams = "/event-list-json?"+str;

      async.parallel(
        _.map(c.cities, function(baseurl) {
          return function(callb) { do_a_demo(c,baseurl,baseurl+flatparams,callb); };
        })
        , function(err,results) {
          console.log("All demosphere done.");
          c.loaded = true;
          c.loading = false;
          c.active = true;

          // al process takes long time with $ ajax callbacks. refresh universe.
          $scope.$apply();
          callback();
      });
    };
    var do_a_demo = function(c,baseurl,longurl,callb) {
      /*
        bacause of CORS
        did not succeed with $http
        neither with http://whateverorigin.org (don't accept GET params)
        but like following... seems OK (?)
      */
      
      // cors.io went down !
      //$.getJSON('http://cors.io?u='+encodeURIComponent(longurl), function(data) {
      
      // crossorigin.me blocked us ?
      $.getJSON('https://crossorigin.me/'+longurl, function(data) {

      // direct call is not allowed :(
      //$.getJSON(longurl, function(data) {
      
        //console.log("RECEIVED:",data)
        _.each(data.events, function(e) {
          addMarker({
            source: "demos",
            name: e.title,
            description: moment(e.start_time*1000).format("dddd Do MMMM, H[h]mm"),
            address: e.place__city__name,
            web: baseurl+e.url,
            lat: e.place__latitude,
            lng: e.place__longitude
          });
        });
        callb();
      });
    };

    ///////////////////////////////////////////////////////////////
    var buildSearchControl = function() {
      
      if($scope.searchControl) 
        $scope.searchControl.removeFrom($scope.map);

      //console.log("overlays !!",layers);
      $scope.searchControl = L.control.search({
        layer: $scope.layers,
        initial: false,
        zoom: 9,
        //container: "searchinputformap",
        // formatData: function(json) { // to also search within descriptions ?
        //   var jsonret = {};
        //   for(i in json) {
        //     console.log(json[i]);
        //     jsonret["gan"] = L.latLng( json[i][ propLoc[0] ], json[i][ propLoc[1] ] );
        //   }
        //   return {yo:"trop"};
        // },
        callTip: function(text, val) {
          var d = val.layer.options.raw;
          var sou = '<span class="markdiv-'+d.credit.color+' source">'+d.credit.slug+'</span> ';
          var add = d.address ? ' <span class="address">'+totext(d.address)+'</span>' : "";
          var des = d.description ? ' <span class="description">'+totext(d.description)+'</span>' : "";
          return '<div>'+sou+text+add+des+'</div>';
        }
      });
      $scope.searchControl.addTo($scope.map);
    };

    ///////////////////////////////////////////////////////////////
    // load a map credit
    var loadCredit = function(c,callb) {
      //console.log("Fetch csv:",c.slug,c);
      c.loading = true;

      if(c.type=="demosphere")
        do_demosphere(c,callb);
      else

      $http
      .get(settings.datapath+'/map/map_'+c.slug+"."+c.type)
      .success(function(data) {

        //console.log(beatthebob.test());

        parseMapCreditAndDo(c,data,addMarker);
        
        c.loaded = true;
        c.loading = false;
        c.active = true;
        callb();
      })
      .error(function(err) {
        c.loaded = false;
        console.log(err);
        callb();
      });

    };

    ///////////////////////////////////////////////////////////////
    $scope.toggleMapLegendAll = function() {
      var credits = _.filter($scope.meta.mapcredits, function(c) {
        return !c.dontload;
      });
      async.parallel(
        _.map(credits, function(c) {
          return function(callb) {
            c.active = true;
            if(!c.loaded)
              loadCredit(c,callb);
            else
              callb();
          };
        })
        , function(err,results) {
          buildSearchControl();
          updateMapStyles();
      });
    };
    $scope.toggleMapLegendNone = function() {
      _.each($scope.meta.mapcredits, function(c) {
        c.active = false;
      });
      updateMapStyles();
    };
    $scope.toggleMapLegend = function(c) {
      //console.log("Toggling:",c);
      
      if(c) {
        c.active = !c.active;
        
        if(c.active && !c.loaded && !c.loading) {
          loadCredit(c, function() {
            buildSearchControl();
            updateMapStyles();
          });
        } else {
          updateMapStyles();
        }
      }
    };

    ///////////////////////////////////////////////////////////////
    ////////////////////// NINJA !! ///////////////////////////////
    ///////////////////////////////////////////////////////////////

    $scope.resetNinjaSettings = function() {
      var ninj = $scope.state.ninja;
      $scope.ninjalist = $scope.ninjalist_original;
      ninj.count = $scope.ninjalist.length;
      ninj.in.min = 0;
      ninj.in.max = ninj.in.MAX;
      ninj.out.min = 0;
      ninj.out.max = ninj.out.MAX;

      // $scope.state.ninja.count = $scope.ninjalist.length;
      // $scope.state.ninja.in.min = 0;
      // $scope.state.ninja.in.max = $scope.state.ninja.in.MAX;
      // $scope.state.ninja.out.min = 0;
      // $scope.state.ninja.out.max = $scope.state.ninja.out.MAX;
    }
    $scope.updateNinjaSettings = function() {
      var sta = $scope.state.ninja;
      $scope.ninjalist = _.filter($scope.ninjalist_original, function(e) {
        return (e.InDegree >= sta.in.min) && (e.InDegree <= sta.in.max) &&
            (e.OutDegree >= sta.out.min) && (e.OutDegree <= sta.out.max);
      });
      $scope.state.ninja.count = $scope.ninjalist.length;
    };

    $scope.refreshNinjaFrame = function(url) {
      console.log("Ninja loading", url);
      $scope.state.ninja.intro = false;
      $scope.state.ninja.url = $sce.trustAsResourceUrl(url);
    };
    $scope.loadRandomNinja = function() {
      if($scope.ninjalist.length==0)
        $scope.resetNinjaSettings();
      $scope.loadNowNinja( _.sample($scope.ninjalist) );
    }
    $scope.loadNowNinja = function(e) {
      var sta = $scope.state.ninja;

      sta.intro = false;
      sta.settings = false;
      sta.searching = false;
      sta.current = e;
      $scope.refreshNinjaFrame(e.Url);

      // get detail of links
      $http.get("http://utopies-concretes.org/data/network/links/"+e.Id+"_in.csv")
      .success(function(data) {
        $scope.state.ninja.current.ins = _.map(new CSV(data, {header:true, cast:true}).parse(), function(i) {
          return _.extend($scope.ninjalistById[i.id], {count:parseInt(i.count)});
        });
        $scope.state.ninja.current.ins = _.sortBy($scope.state.ninja.current.ins,'count').reverse();
        if(!$scope.state.ninja.current.ins) $scope.state.ninja.current.ins = [];
      });

      $http.get("http://utopies-concretes.org/data/network/links/"+e.Id+"_out.csv")
      .success(function(data) {
        $scope.state.ninja.current.outs = _.map(new CSV(data, {header:true, cast:true}).parse(), function(i) {
          return _.extend($scope.ninjalistById[i.id], {count:parseInt(i.count)});
        });
        $scope.state.ninja.current.outs = _.sortBy($scope.state.ninja.current.outs,'count').reverse();
        if(!$scope.state.ninja.current.outs) $scope.state.ninja.current.outs = [];
      });
    };
    $scope.updateNinjaSuggestions = function() {
      $scope.state.ninja.suggestions = [];
      if($scope.state.ninja.input.length>1) {
        var rg = new RegExp($scope.state.ninja.input,'i');
        _.each($scope.ninjalist, function(l) {
          if(rg.test(l.Urls))
            $scope.state.ninja.suggestions.push(l);
        })
      }
    };

    var initNinja = function() {
      var url = "http://utopies-concretes.org/data/network/network_in.csv";
      $http
      .get(url)
      .success(function(data) {
        //console.log(data);

        $scope.ninjalist = new CSV(data, {header:true, cast:true}).parse();
        $scope.state.ninja.count = $scope.ninjalist.length;
        
        //console.log(list);
        var maxIn = 0;
        var maxOut = 0;
        _.each($scope.ninjalist, function(l) {
          l.UrlsArray = l.Urls.split(" ");
          l.Url = l.UrlsArray[0];
          l.InDegree = parseInt(l.InDegree);
          l.OutDegree = parseInt(l.OutDegree);
          maxIn = Math.max(maxIn,l.InDegree);
          maxOut = Math.max(maxOut,l.OutDegree);
        });
        $scope.ninjalist = _.sortBy($scope.ninjalist, function(e) {
          return e.Url.replace(/https*:\/\/(www\.)*/,"");
        });
        $scope.state.ninja.in.MAX = maxIn;
        $scope.state.ninja.out.MAX = maxOut;

        $scope.ninjalist_original = $scope.ninjalist;
        $scope.ninjalistById = _.indexBy($scope.ninjalist, 'Id');
        
        $scope.resetNinjaSettings();
      })
      .error(function(err) {
        console.log(err);
      });
    };


    ///////////////////////////////////////////////////////////////
    ///////////////////// DO THINGS !! ////////////////////////////
    ///////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////
    fetchAndPopulateData( 'meta', function() {

      fetchAndPopulateData($scope.state.layout);

      // (to improve ?) init here to trigger the watch on footer content set though compile-here directive
      $scope.state.search = "";

    });

  }
]);