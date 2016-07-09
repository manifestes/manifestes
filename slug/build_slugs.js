var webshot = require('webshot');
var Handlebars = require('handlebars');
var fs = require('fs');
var mkdirp = require('mkdirp');
var yaml = require('js-yaml');
var md = require("node-markdown").Markdown;

function slugify(str) {
	str = str.replace(/\?|!/g,"");
	str = str.replace(/^\s+|\s+$/g, ''); // trim
	str = str.toLowerCase();
	// remove accents, swap ñ for n, etc
	var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
	var to   = "aaaaeeeeiiiioooouuuunc------";
	for (var i=0, l=from.length ; i<l ; i++)
	str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
	str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
	.replace(/\s+/g, '-') // collapse whitespace and replace by -
	.replace(/-+/g, '-'); // collapse dashes
	return str;
}

	// init template
fs.readFile('template.html', function(error, data) {
	if (!error) {
	    var html = data.toString();
	    template = Handlebars.compile(html);
		
		try {
			var ym = fs.readFileSync('data/texts_fr.yml', 'utf8');
			
			var j = 0;
			// yml load & each page loop
			var pages = yaml.loadAll(ym, function(p) {
				j++;
				p.slug = slugify(p.title);
				p.contenthtml = md(p.content);

				console.log("Do: ",p.slug);
				
				var html = template(p);

				if(p.status && p.status=='draft') return;
				if(!p.image || !p.image.url) return;

				// create mini dir for this page if not exists
				mkdirp('slug/'+p.slug, function(err) { 
					// write
					fs.writeFile("slug/"+p.slug+"/index.html", html, function(err) {
						if(err) console.log(err);
						var url = "http://localhost/manifestes/slug/"+p.slug+"/index.html";
						console.log("url: ",url);
						webshot(
							url,
							"jumps/"+p.slug+"/"+p.slug+".jpg",
							{
								siteType:'url',
								screenSize: {
									width: 435,
									height: 375
								},
								shotSize: {
									width: 435,
									height: 375
								}
							},
							function(e) { if(e) console.log(e); }
						);
					});
				});
			});
		} catch (ex) {
			console.log(ex);
		}
	} else {
		console.log("Error file",error);
	}
});






