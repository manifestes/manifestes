

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
var gethref = function(str) {
  var m = str.match(/<a href=[\"\']([^[\"\']*)[\"\']/);
  if(m && m.length>0) return m[1];
  else return "";
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
        web = gethref(prop.description);
      }
      if(c.slug=='passeco') {
        web = c.url +"/"+ gethref(prop.title);
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

  /* agefa before being json was XML ! */
  
  /*
  if(c.type=="xml") {
    
    var x2js = new X2JS();
    var json = x2js.xml_str2json(data);
    console.log(json);

    _.each(json.markers.marker, function(m,k) {
      foreachdo({
        source: c.slug,
        name: m._name,
        description: "Point de vente de L'âge de faire",
        address: m._address,
        lat: m._lat,
        lng: m._lng
      });
    });
  }
  */

  if(c.type=="json") {

    if(c.jsonprefix) data = data[c.jsonprefix];

    _.each(data, function(m) {

      if(c.slug=="agefa")
        if(foreachdo) foreachdo({
          source: "agefa",
          name: m.name,
          description: "Point de vente de L'âge de faire",
          address: m.address,
          lat: m.lat,
          lng: m.lng
        });

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

      if(c.slug=="zeste")
        if(foreachdo) foreachdo({
          source: "zeste",
          name: m.name,
          description: m.headline,
          lat: m.latitude,
          lng: m.longitude,
          web: "https://www.zeste.coop/fr/"+m.permalink
        });

    });
  }

};

// if(! typeof require) {
//  module.exports.parseMapCreditAndDo = parseMapCreditAndDo;
// }


