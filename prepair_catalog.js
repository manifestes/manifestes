var map_parser = require('src/js/map_parser');

var csv = require('csv');
var jsyaml = require('js-yaml');
var fs = require('fs');
var async = require('async');
var request = require('request');
var _ = require('underscore');

var BASEPATH = "data/";
var catalog = [];

///////////////////////////////////
var fetchTexts = function(callb) {
	fs.readFile(BASEPATH+"texts.yml", function(error,body) {
		if(error) console.log(error);

		jsyaml.loadAll(body, function(e) {
			catalog.push(_.omit(e,['date','tags']));
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
			catalog.push(_.omit(e,['used']));
		});
		callb(); //done
	});
};

///////////////////////////////////
var fetchLinks = function(callb) {
	fs.readFile(BASEPATH+"links.yml", function(error,body) {
		if(error) console.log(error);
		console.log(body);
		var llist = body.split('\n\n');
		_.each(llist, function(l) {
			catalog.push({
				t: 'link',
				content: md2Html( l.split('\n')[1] )
			});
		});
	});
};

///////////////////////////////////
var fetchCsv = function(file, callb) {
	fs.readFile(BASEPATH+file, function(error,body) {
		csv.parse(body, {columns: true}, function(err, data) {
			if(err) console.log(err);
			_.each(data, function(l) {
				catalog.push({
					urls: l.Urls
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
			return !c.dontload;
		});

		async.parallel(

			_.map(credits, function(c) {
				return function(llb) { 
					
					// fetch data and do
					fs.readFile(BASEPATH+file, function(error,body) {
						if(error) console.log(error);
						parseMapCreditAndDo(c,body,function(pt) {
							catalog.push(pt);
						});
						llb();
					});
				};
			}),
			function(err,results) {
				console.log("All map data fetchs done. Bravo.");
				callb();
			}
		);
	});
};

// 4. write all catalog into catalog.yml
var writeYml = function(callb) {
	yml.stringify(catalog, function(err, data) {
		fs.writeFile(BASEPATH+"catalog.yml", data, function(err) {
			if(err) console.log(err);

			callb(); //done
		});		
	});
};

///////////////////////////////////
// DO THINGS
fetchTexts( function() {
	fetchQuotes( function() {
		fetchLinks( function() {
			fetchCsv("network/network_in.csv",function() {
				fetchCsv("inspiration.json",function() {
					fetchMaps(function() {
						// randomize catalog order ?
						writeYml(function() {
							console.log("written catalog.yml");
						})
					})
				})
			})
		})
	})
});



