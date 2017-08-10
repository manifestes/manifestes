var csv = require('csv');
var fs = require('fs');
var request = require('request');
var _ = require('underscore');

var dataurl = "http://localhost/manifestes/data/network/network_links.csv";
console.log("Request:",dataurl);

var links = {};

request({ uri: dataurl }, function(error,response,body) {

	csv.parse(body, {columns: true}, function(err, data) {

		if(err) console.log(err);

		// prepair data
		_.each(data, function(l) {
			// init
			if(!links[l.Source])
				links[l.Source] = {
					in: [],
					out: []
				};
			if(!links[l.Target])
				links[l.Target] = {
					in: [],
					out: []
				};
			// push
			links[l.Source].out.push({
				id: l.Target,
				count: l.HyperlinkCount
			});
			links[l.Target].in.push({
				id: l.Source,
				count: l.HyperlinkCount
			});
		});

		// write all outputs
		_.each(links, function(v,k) {
			//console.log(v,k);
			csv.stringify(links[k].in, {header:true}, function(err, data) {
				fs.writeFile("data/network/links/"+k+"_in.csv", data, function(err) {
					if(err) console.log(err);
				});		
			});
			csv.stringify(links[k].out, {header:true}, function(err, data) {
				fs.writeFile("data/network/links/"+k+"_out.csv", data, function(err) {
					if(err) console.log(err);
				});		
			});

		});
	});

});