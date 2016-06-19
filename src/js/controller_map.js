'use strict';

angular.module('manifest.mapcontroller', ['underscore','config'])
////////////////////////////////////////////////////////////////////////
.controller('MapController', [
  '$scope',
  '$http',
  '$timeout',
  '_',
  'settings',
  function ($scope, $http, $timeout, _, settings) {

    var mappathprefix = settings.datapath+'/map/map_';

    ///////////////////////////////////////////////////////////////
    var fetchDataMap = function(callb) {
      $http
      .get(settings.datapath + "map_"+$scope.state.lang+".yml")
      .success(function(res) {
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

        callb();
      })
      .error(function (data, status, headers, config) {
        console.log("error map",status);
      });
    }

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

    var initMap = function() {

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

      var map = L.map('leaflet', {
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
      }).addTo(map);

      L.control.locate({
        position: 'topleft', //'bottomleft',
        icon: 'fa fa-street-view',
        showPopup: false,
      }).addTo(map);

      $scope.layers = new L.LayerGroup().addTo(map);

      var layerControl = L.control.layers(tileLayers, null, {position: 'topleft'});
      layerControl.addTo(map);

      $scope.map = map;

    };

    ///////////////////////////////////////////////////////////////
    // business to add a point
    var addMarker = function(m,credit) {
      var credit = $scope.meta.mapcreditsOf['misc'];
      if($scope.meta.mapcreditsOf.hasOwnProperty(m.source))
        credit = $scope.meta.mapcreditsOf[m.source];
        

      // MakiMarkers !
      var icon = 'circle';
      //var color = "#"+credit.color || "#000";
      var size = $scope.settings.smallDevice ? [13,13] : [9,9];
      // icons use maki-markers: https://www.mapbox.com/maki/
      if(/region/.test(m.scale)) {
        size = $scope.settings.smallDevice ? [14,14] : [11,11];
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
        size = $scope.settings.smallDevice ? [17,17] : [15,15];
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
        'maxWidth': '500',
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
    var fetch_csv = function(c,callb) {
      //console.log("Fetch csv:",c.slug,c);
      $http
      .get(mappathprefix+c.slug+'.csv')
      .success(function(data) {
        //console.log("got csv data:",data);
        //$scope.data = data;
        var ms = new CSV(data, {header:true, cast:false}).parse();
        
        $scope.points = ms;
        
        _.each(ms, function(m,k) {

          // if(!layers[m.source]) {
          //   layers[m.source] = new L.LayerGroup().addTo(overlays);
          // }

          // don't look inside csv for source (unuseful column ;)
          m.source = c.slug;
          addMarker(m);
          
        });
        c.loaded = true;
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
    var fetch_geojson = function(c,callb) {
      //console.log("Fetch geojson:",c.slug,c);
      $http
      .get(mappathprefix+c.slug+'.geojson')
      .success(function(geoj) {
        //console.log(c.slug,geoj);
        _.each(geoj.features, function(m) {

          // default
          var name = totext(m.properties.title);
          var description = m.properties.description;
          var web =  "";

          if(c.slug=='report') {
            name = name.replace(/Il y a \d* jours./,"");
            web = c.url +"/"+ m.properties.title.match(/href:\'([^\']*)\'/)[1];
          }
          if(c.slug=='basta') {
            web = m.properties.title.match(/<a href=\'([^\']*)\'/)[1];
          }
          if(c.slug=='passeco') {
            web = c.url +"/"+ m.properties.title.match(/<a href=\"([^\"]*)\"/)[1];
          }
          if(c.slug=='ecole' || c.slug=='fermav') {
            name = m.properties.Name;
          }

          addMarker({
            source: c.slug,
            name: name,
            description: description,
            web: web,
            lat: m.geometry.coordinates[1],
            lng: m.geometry.coordinates[0]
          });
        });
        c.loaded = true;
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
    var fetch_xml = function(c,callb) {
      //console.log("Fetch xml:",c.slug,c);
      $http
      .get(mappathprefix+c.slug+'.xml')
      .success(function(xml) {
        var json = xmlToJSON.parseString(xml, {
          childrenAsArray: false
        });
        //console.log("Age de:",json);
        _.each(json.markers.marker, function(m) {
          addMarker({
            source: c.slug,
            name: m._attr.name._value,
            description: "Point de vente de L'âge de faire",
            address: m._attr.address._value,
            lat: m._attr.lat._value,
            lng: m._attr.lng._value
          });
        });
        c.loaded = true;
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
    var fetch_json = function(c,callb) {
      //console.log("Fetch json:",c.slug,c);
      $http
      .get(mappathprefix+c.slug+'.json')
      .success(function(json) {
        _.each(json, function(m) {

          if(c.slug=="circc")
            addMarker({
              source: "circc",
              name: m.nom || " ", // warning not to crash the leaflet-search !
              description: m.comm,
              address: m.loc,
              web: m.web,
              lat: m.lat,
              lng: m.lng
            });

          if(c.slug=="ffdn" && m.coordinates)
            addMarker({
              source: "ffdn",
              name: m.shortname || " ", // warning not to crash the leaflet-search !
              description: m.popup,
              lat: m.coordinates.latitude,
              lng: m.coordinates.longitude
            });
        });
        c.loaded = true;
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
    var fetch_demosphere = function(c,callback) {
      console.log("Fetch demosphere:",c.slug,c);
      async.parallel(
        _.map(c.cities, function(basedemurl) {
          return function(callb) { fetch_a_demo(c,basedemurl,callb); };
        })
        , function(err,results) {
          console.log("All demosphere done.");
          c.loaded = false;
          c.active = true;
          callback();
      });
    };
    var fetch_a_demo = function(c,basedemurl,callb) {

      var nowtmstp = parseInt(Date.now()/1000);
      //console.log("date",nowtmstp);
      var p = {
        startTime: nowtmstp,
        //endTime: 1456763106,
        place__latitude: true,
        place__longitude: true,
        place__zoom: true,
        topics: true,
        url: true,
        //limit: 1,
        random: 0.40452415758106963
      };

      var str = "";
      for(var key in p) {
        if(str!="") {
          str+="&";
        }
        str += key+"="+encodeURIComponent(p[key]);
      }
      var demo = basedemurl+"/event-list-json"//;+"?"+str;
      console.log("URL",demo);
      //var url = "http://whateverorigin.org/get?url="+demo+"&callback=?";
      //var url = "http://cors.io/?u="+demo;
      var url = demo;
      $http({
          method: 'GET',
          url: url
      }).
      success(function(status) {
        console.log("S",status);
      }).
      error(function(status) {
        console.log("E",status);
      });

      // $http({
      //   url: url,
      //   //params: p,
      //   method: 'GET',
      //   transformResponse: [function (data) {
      //       // Do whatever you want!
      //       console.log("Here is the",data);
      //       return data;
      //   }]
      // });

      // $http
      // .get(basedemurl + "/event-list-json", { params: p })
      // //.get(url)
      // .success(function(json) {
      //   console.log("Demosph:",json);
      //   _.each(json.events, function(e) {
      //     addMarker({
      //       source: "demosphere",
      //       name: e.time,
      //       description: e.title,
      //       address: e.place_city_name,
      //       web: u+e.url,
      //       lat: e.place__latitude,
      //       lng: e.place__longitude
      //     });
      //   });
      //   callb();
      // });

      callb();
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
      if(c.type=="csv") // csv
        fetch_csv(c,callb);
      else if(c.type=="geojson") //report,bastam,passeco,fermesavenir
        fetch_geojson(c,callb);
      else if(c.type=="xml") //agedefaire
        fetch_xml(c,callb);
      else if(c.type=="json") //ffdn,circuitscours
        fetch_json(c,callb);
      // else if(c.type=="demosphere")
      //   fetch_demosphere(c,callb);
      else {
        console.log("Unkwnown map type !",c);
        callb();
      }
    };

    ///////////////////////////////////////////////////////////////
    $scope.toggleMapLegendAll = function() {
      async.parallel(
        _.map($scope.meta.mapcredits, function(c) {
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
        
        if(c.active && !c.loaded) {
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
    // DO THINGS !!
    fetchDataMap(function() {
      
      initMap();

      $timeout(function() {

        // now FETCH data (only of big screen)
        if(!$scope.settings.smallDevice) {

          async.parallel(
            _.map($scope.meta.mapcredits, function(c) {
              return function(callb) { loadCredit(c,callb); };
            })
            , function(err,results) {

            console.log("All map data fetchs done. Bravo.");

            buildSearchControl();
            updateMapStyles();
            //$scope.$apply();

            // when ready, remove loading
            //$timeout(function(){ $scope.state.loading = false; });
            //$scope.state.mapstatus = "DONE";
          });

        } else {
          console.log("Not loading map data 'cause small screen");
        }
        
      });
      
    });
    

  }
]);