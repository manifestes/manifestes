var webshot = require('webshot');
var Handlebars = require('handlebars');
var fs = require('fs');
var mkdirp = require('mkdirp');
var yaml = require('js-yaml');
var md = require("node-markdown").Markdown;

function slugify(str) {
	if(!str || str.length<2) return "";
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
fs.readFile('slug_template.html', function(error, data) {
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
				//p.contenthtml = md(p.content);
				if(p.quote) {
					p.quotehtml = md(p.quote.content);
					p.authorhtml = p.quote.author ? md(p.quote.author) : "";
				}

				// Social meta
				p.pageauthor = "http://utopies-concretes.org";
				p.pageimage = "http://utopies-concretes.org/slug/"+p.slug+"/"+p.slug+".png";
				p.pagetitle = "♥ Utopies Concrètes — "+p.title;
				p.pagekeywords = p.title +" "+p.subtitle;
				p.pagedescr = p.subtitle;
				p.pageurl = "http://utopies-concretes.org/slug/"+p.slug;
				
				// Social share
				p.shareurl = "http://utopies-concretes.org/slug/"+p.slug;
				p.sharetitle = "♥ Utopies Concrètes — "+p.title; // short ! (twitter message)
				p.sharetext = p.subtitle; // may be longer (caption/description)
				p.shareimage = "http://utopies-concretes.org/slug/"+p.slug+"/"+p.slug+".png";
				
				p.imagewidth = 750;
				p.imageheight = 400;
				
				console.log("Do: ",p.slug);
				
				var html = template(p);

				if(p.status && p.status=='draft') return;
				//if(!p.image || !p.image.url) return;
				//if(j>7) return;

				// create mini dir for this page if not exists
				mkdirp('slug/'+p.slug, function(err) { 
					// write
					fs.writeFile("slug/"+p.slug+"/index.html", html, function(err) {
						if(err) console.log(err);
						var url = "http://localhost/manifestes/slug/"+p.slug+"/index.html";
						//console.log("Wrote index file: ",p.slug);
						webshot(
							url, 
							"slug/"+p.slug+"/"+p.slug+".png",
							{
								siteType:'url',
								screenSize: {
									width: p.imagewidth,
									height: p.imageheight
								},
								shotSize: {
									width: p.imagewidth,
									height: p.imageheight
								}
							},
							function(e) {
								if(e) console.log(e);
								console.log("Webshot done: ",p.slug);
							}
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






