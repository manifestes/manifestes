
var map_parser = require('./src/js/map_parser.js');

var csv = require('csv');
var jsyaml = require('js-yaml');
var fs = require('fs');
var async = require('async');
var request = require('request');
var marked = require('marked');
var _ = require('underscore');

var BASEPATH = "data/";
var catalog = [];


var totextwithbreak = function(htm) {
  if(htm) return htm.replace(/<[^>]+>/gm,'<br>').replace(/(<br> *)+/gm,'<br>');
  else return "";
};
var truncatetext = function(str,l) {
  if(str.length>l)
    return str.substring(0,l)+" [...]";
  else
    return str;
};




///////////////////////////////////
var fetchTexts = function(callb) {
	fs.readFile(BASEPATH+"texts.yml", function(error,body) {
		if(error) console.log(error);

		jsyaml.loadAll(body, function(e) {
			catalog.push({
				t: e.title,
				s: e.subtitle,
				c: e.content
			});
		});
		callb(); //done
	});
};

///////////////////////////////////
var fetchQuotes = function(callb) {
	fs.readFile(BASEPATH+"quotes.yml", function(error,body) {
		if(error) console.log(error);

		var qs = jsyaml.load(body);
		_.each(qs, function(e) {
			catalog.push({
				q: e.content
			});
		});
		callb(); //done
	});
};

///////////////////////////////////
var fetchLinks = function(callb) {
	fs.readFile(BASEPATH+"links.yml", 'utf8', function(error,body) {
		if(error) console.log(error);
		
		var llist = body.split('\n\n');
		_.each(llist, function(l) {
			catalog.push({
				l: marked( l.split('\n')[1] )
			});
		});
		callb(); //done
	});
};

///////////////////////////////////
var fetchImages = function(callb) {
	fs.readFile(BASEPATH+"inspiration.json", function(error,body) {
		if(error) console.log(err);

		var obj = JSON.parse(body);
		_.each(_.values(obj), function(e) {
			catalog.push({
				i: e
			});
		});

		callb(); //done
	});
};

///////////////////////////////////
var fetchNetworkUrls = function(callb) {
	fs.readFile(BASEPATH+"network/network_in.csv", function(error,body) {
		csv.parse(body, {columns: true}, function(err, data) {
			if(err) console.log(err);
			_.each(data, function(l) {
				catalog.push({
					u: l.Urls
				});
			});

			callb(); //done
		});
	});
};

///////////////////////////////////
var fetchMaps = function(callb) {
	// first load maps
	fs.readFile(BASEPATH+"map.yml", function(error,body) {
		if(error) console.log(error);

		var mapmeta = jsyaml.load(body);
		var credits = _.filter(mapmeta.mapcredits, function(c) {
			return !c.hide;
		});

		async.parallel(

			_.map(credits, function(c) {
				return function(llb) { 
					
					// fetch data and do
					fs.readFile(BASEPATH+"map/map_"+c.slug+"."+c.type, 'utf8', function(error,body) {
						if(error) console.log(error);
						map_parser.parseMapCreditAndDo(c,body,function(pt) {
							pt.name = totextwithbreak(pt.name);
							pt.description = truncatetext(totextwithbreak(pt.description),250);
							catalog.push({
								m: pt.name,
								d: pt.description,
								s: pt.source,
							});
						});
						console.log("processed ",c.name);
						llb();
					});
				};
			}),
			function(err,results) {
				console.log("all map data fetchs done...");
				
				callb(); //done
			}
		);
	});
};

// 4. write all catalog into catalog.yml
var writeYml = function(callb) {
	fs.writeFile(BASEPATH+"catalog.yml", jsyaml.dump(catalog), function(err) {
		if(err) console.log(err);

		callb(); //done
	});
};

///////////////////////////////////
// DO THINGS
fetchTexts( function() {
	fetchQuotes( function() {
		fetchLinks( function() {
			fetchNetworkUrls( function() {
				fetchImages( function() {
					fetchMaps( function() {
						// randomize catalog order ?
						writeYml( function() {
							console.log("written catalog.yml.");
						})
					})
				})
			})
		})
	})
});



