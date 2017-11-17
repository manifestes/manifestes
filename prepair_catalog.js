var csv = require('csv');
var fs = require('fs');
var request = require('request');
var _ = require('underscore');

// yaml ?


var catalog = [];

///////////////////////////////////
// 1. load texts, links, quotes
var fetchYml = function(name, callb) {
	yml.parse(name+"_fr.yml", function(error,response,body) {
		if(err) console.log(err);
		_.each(data, function(e) {
			if(name=="texts") {
				catalog.push(e);
			}
			if(name=="quotes") {
				catalog.push(e);
			}
			if(name=="links") {
				catalog.push(e);
			}
		});
		callb(); //done
	})
});

///////////////////////////////////
// 2. load network nodes
var fetchNetwork = function(callb) {
request({ uri: dataurl }, function(error,response,body) {

	csv.parse(body, {columns: true}, function(err, data) {
		if(err) console.log(err);
		_.each(data, function(l) {
			// init
			if(!links[l.Source])


		});

		callb(); //done
	});
});

///////////////////////////////////
// 3. load map sources
var fetchMaps = function(callb) {
	// first load maps
	fs.openFile("map_fr.yml", function(error,response,body) {
		if(err) console.log(err);

		var mapset = jsyaml.load(body);

	});
});

// 4. write all catalog into catalog.yml
var writeYml = function(callb) {
	yml.stringify(catalog, function(err, data) {
		fs.writeFile("data/catalog.yml", data, function(err) {
			if(err) console.log(err);
			callb(); //done
		});		
	});
});

///////////////////////////////////
// DO THINGS
fetchYml("texts", function() {
	fetchYml("quotes", function() {
		fetchYml("links", function() {
			fetchNetwork(function() {
				fetchMaps(function() {
					// randomize catalog order

					writeYml(function() {
						console.log("written catalog.yml");
					})
				})
			})
		})
	})
});






