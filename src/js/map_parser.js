

//if(! typeof require) { // nw on PROD
  // var _ = require('underscore');
  // var CSV = require('comma-separated-values');
  // var xml2js = require('xml2js');
//}


var totextwithbreak = function(htm) {
  if(htm) return htm.replace(/<[^>]+>/gm,'<br>').replace(/(<br> *)+/gm,'<br>');
  else return "";
};
var truncatetext = function(str) {
  if(str.length>400)
    return str.substring(0,400)+" [...]";
  else
    return str;
};

// var beatthebob = (function () {
//   "use strict";
//    return {
//       test: (function () {
//         return 'testouou';
//       }()),
//       test2: (function () {
//         return console.log('test 2');
//       })
//    };
// }());


///////////////////////////////////////////////////////////////
var parseMapCreditAndDo = function(c,data,foreachdo) {

  if(c.type=="csv") {
    var ms = new CSV(data, {header:true, cast:false}).parse();
    //$scope.points = ms; // testing an index (print)
    _.each(ms, function(m,k) {
      // if(!layers[m.source]) {
      //   layers[m.source] = new L.LayerGroup().addTo(overlays);
      // }

      // don't look inside csv for source (unuseful column ;)
      m.source = c.slug;
      if(foreachdo) foreachdo(m);
    });
  }

  if(c.type=="geojson") {
    _.each(data.features, function(m) {

      var prop = m.properties;

      // default
      var name = totext(prop.title);
      var description = prop.description;
      var web =  "";

      if(c.slug=='report') {
        name = name.replace(/Il y a \d* jours./,"");
        web = c.url +"/"+ prop.title.match(/href:\'([^\']*)\'/)[1];
      }
      if(c.slug=='basta') {
        web = prop.description.match(/<a href=\'([^\']*)\'/)[1];
      }
      if(c.slug=='passeco') {
        web = c.url +"/"+ prop.title.match(/<a href=\"([^\"]*)\"/)[1];
      }
      if(c.slug=='ecole' || c.slug=='fermav') {
        name = prop.Name;
      }
      if(c.slug=='collec') {
        name = prop.name;
        description = "Collecteurs de déchets";
        web = prop.description;
      }
      if(c.slug=="graino") {
        name = prop.name;
      }
      if(c.slug=="cnlii") {
        var ds = totext(prop.description).replace(/{{.*}}/,"");
        name = prop.name;
        description = truncatetext(ds);
        web = /\[\[.*\]\]/.test(ds) ? ds.match(/\[\[(.*)\]\]/)[1].split('|')[0] : "";
      }

      if(foreachdo) foreachdo({
        source: c.slug,
        name: name,
        description: description,
        web: web,
        lat: m.geometry.coordinates[1],
        lng: m.geometry.coordinates[0]
      });
    });
  }

  if(c.type=="xml") {
    
    //var json = xmlToJSON.parseString(data, { childrenAsArray: false });

    xml2js.parseString(data, function (err, json) {
      //console.log("Age de:",JSON.stringify(json));
      _.each(json.markers.marker, function(m,k) {
        var e = _.values(m)[0];
        foreachdo({
          source: c.slug,
          name: e.name._value,
          description: "Point de vente de L'âge de faire",
          address: e.address._value,
          lat: e.lat._value,
          lng: e.lng._value
        });
      });
    });
  }

  if(c.type=="json") {
    _.each(data, function(m) {

      if(c.slug=="circc")
        if(foreachdo) foreachdo({
          source: "circc",
          name: m.nom,
          description: m.comm,
          address: m.loc,
          web: m.web,
          lat: m.lat,
          lng: m.lng
        });

      if(c.slug=="ffdn" && m.coordinates)
        if(foreachdo) foreachdo({
          source: "ffdn",
          name: m.shortname,
          description: m.popup,
          lat: m.coordinates.latitude,
          lng: m.coordinates.longitude
        });

      if(c.slug=="oasis")
        if(m.geo)
          if(foreachdo) foreachdo({
            source: "oasis",
            name: m.title,
            description: truncatetext(totextwithbreak(m.html)),
            lat: m.geo.lat,
            lng: m.geo.lng
          });
    });
  }

};

// if(! typeof require) {
//  module.exports.parseMapCreditAndDo = parseMapCreditAndDo;
// }


