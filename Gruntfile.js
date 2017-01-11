module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    // to list files in directory into a json
    
    // tree: {
    //   options: {
    //     // md5: boolean or number [1-32] | default: false 
    //     // format: | boolean default: false 
    //     // type: array | default: [] 
    //     // recurse: boolean | default: true 
    //     // cwd: string | default: "" 
    //     // ext: object 
    //     //      ext.level: boolean or number [1-N] | default: false 
    //     //      ext.hyphen: string | default: "-" 
    //     // exclude: array | default: [] 
    //     // uncpath: boolean | default: false 
    //     prettify: true
    //   },
    //   your_target: {
    //     files: [
    //         {
    //             src: ['data/expo'],
    //             dest: 'data/expo.json'
    //         }
    //     ]
    //   }
    // },

    preprocess : {
      prod : {
        src : 'src/index.html',
        dest : 'index.html',
        options : {
          context : {
            // hard written html meta within index.html
            title: "manifeste(s) des utopies concrètes",
            author: "collectif(s) des utopies concrètes",
            copyleft: "GNU License v2",
            description: "Manifeste(s), annuaire et cartographies des alternatives - collectif(s) des territoires communs autogérés et alternatives convivialistes DIY bénéloves révolutionnaires de la transition sociale et écologique dans les tiers-lieux créatifs des clowns bricoleurs pirates des utopies libertaires écoféministes p2p et coopératistes indignées activistes de la résilience décroissante concrète et désobéissante des convergences des luttes",
            keywords: "manifeste, convergence des luttes, utopies concrètes, annuaire, carte, alernatives, décroissance, transition, autogestion, communs, résilience, écologie, convergence, écriture collective, DIY, politique, philosophie"
          }
          // context_es : {
          //   title: "Manifiesto(s)",
          //   author: "collectif(s)",
          //   copyleft: "GNU License v2",
          //   description: "collectivo(s) de los territorios comunes autogestionados y alternativas convivialistas DIY voluntarios revolucionarios de la transición social y ecológica en los terceros lugares creativos de los clowns del bricolaje piratas de las utopías libertarias ecofeministas p2p y cooperativistas indignadas activistas de la resiliencia decreciente concreta y desobediente de las convergencias de las luchas",
          //   keywords: "manifiesto, utopías concretas, alernativas, decrecimiento, transición, autogestión, comunes, resiliencia, ecología, convergencia, escritura colectiva, DIY, política, filosofía"
          // }
        }
      }
    },

    ngconstant: {
      options: {
        space: '  ',
        name: 'config'
      },
      // Environment targets
      development: {
        options: {
          dest: 'src/js/config.js' 
        },
        constants: {
          settings: {
            dev: true,
            langs: ['fr','es','en'],
            datapath: '../data/',
            assets: './',
            lastupdate: '<%= grunt.template.today("dd mmmm yyyy - h:MM") %>'
          }
        }
      },
      production: {
        options: {
          dest: 'src/js/config.js'
        },
        constants: {
          settings: {
            dev: false,
            langs: ['fr','es','en'],
            datapath: 'data/',
            assets: 'build/',
            lastupdate: '<%= grunt.template.today("dd mmmm yyyy - h:MM") %>'
          }
        }
      }
    },

    env : {
      options : {
          /* Shared Options Hash */
          //globalOption : 'foo'
      },
      dev: {
        NODE_ENV : 'DEVELOPMENT'
      },
      prod : {
        NODE_ENV : 'PRODUCTION'
      }
    },

    less: {
      prod: {
        options: {
          paths: ["assets"]
        },
        files: {
          "src/css/styles.css": "src/css/main.less"
        }
      }
    },

    concat: {
      options: {
        separator: '\n;\n\n'
      },
      css: {
        src: [
          
          // NB: leaflet & font-awesome dont work if not at the beginning of the css
          // leaflet is here, font-awesome in external css

          'src/vendor/leaflet/dist/leaflet.css',
          
          'src/vendor/normalize.css/normalize.css',
          'src/vendor/hint.css/hint.min.css',

          'src/vendor/leaflet.locatecontrol/dist/L.Control.Locate.min.css',

          'src/css/styles.css'
        ],
        dest: 'build/css/<%= pkg.name %>.css'
      },
      js: {
        src: [
          'src/vendor/comma-separated-values/csv.min.js',
          'src/vendor/xmlToJSON.js/lib/xmlToJSON.js',

          'src/vendor/leaflet/dist/leaflet.js',
          'src/vendor/Leaflet.MakiMarkers/Leaflet.MakiMarkers.js',
          'src/vendor/leaflet.locatecontrol/dist/L.Control.Locate.min.js',
          'src/vendor/leaflet-search/dist/leaflet-search.min.js',
          
          'src/vendor/sigmajs/build/sigma.min.js',
          'src/vendor/sigmajs/build/plugins/sigma.parsers.gexf.min.js',

          'src/vendor/moment/min/moment-with-locales.min.js',
          'src/vendor/underscore/underscore-min.js',
          'src/vendor/zepto/zepto.min.js',

          'src/vendor/angular/angular.min.js',
          'src/vendor/angular-sanitize/angular-sanitize.min.js',
          'src/vendor/angular-route/angular-route.min.js',
          'src/vendor/angular-touch/angular-touch.min.js',
          //'src/vendor/angular-animate/angular-animate.min.js',
          //'src/vendor/ngScroll/ngscroll.min.js',

          'src/vendor/async/dist/async.min.js',
          'src/vendor/fastclick/lib/fastclick.js',
          
          'src/vendor/markdown/lib/markdown.js',
          'src/vendor/js-yaml/dist/js-yaml.min.js',
          'src/js/*.js'
        ],
        dest: 'build/js/<%= pkg.name %>.js'
      }
    },

    copy: {
        dist: {
            files: [
                {
                    expand: true,
                    flatten: true,
                    src: ['src/images/**'],
                    dest: 'build/images/',
                    filter: 'isFile'
                },
                {
                    expand: true,
                    flatten: true,
                    src: ['src/partials/**'],
                    dest: 'build/partials/',
                    filter: 'isFile'
                },
                {
                    expand: true,
                    flatten: true,
                    src: ['src/vendor/leaflet/dist/images/**'],
                    dest: 'build/css/images/',
                    filter: 'isFile'
                },
                {
                    expand: true,
                    flatten: true,
                    src: ['src/vendor/leaflet-search/images/**'],
                    dest: 'build/images/',
                    filter: 'isFile'
                },
                {
                    expand: true,
                    flatten: true,
                    src: ['src/vendor/font-awesome/fonts/**'],
                    dest: 'build/fonts/',
                    filter: 'isFile'
                },
                {
                    expand: true,
                    flatten: true,
                    src: ['src/vendor/font-awesome/css/font-awesome.min.css'],
                    dest: 'build/css/',
                    filter: 'isFile'
                },
                {
                    expand: true,
                    flatten: true,
                    src: ['src/vendor/leaflet-search/dist/leaflet-search.min.css'],
                    dest: 'build/css/',
                    filter: 'isFile'
                }
            ]
        }
    },

    strip : {
      main : {
        src : 'build/js/<%= pkg.name %>.js',
        dest : 'build/js/<%= pkg.name %>.nolog.js',
        options : {
          nodes : ['console.log']
        }
      }
    },

    uglify: {
      options: {
        banner: '\n/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n\n',
        mangle: false
      },
      dist: {
        files: {
          'build/js/<%= pkg.name %>.min.js': ['build/js/<%= pkg.name %>.nolog.js']
        }
      }
    },

    jshint: {
      files: ['Gruntfile.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },

    // fetch data for some maps
    curl: {
      'data/map/map_agefa.xml': 'http://magasin.lagedefaire-lejournal.fr/index.php?controller=stores?ajax=1&all=1',
      'data/map/map_basta.geojson':'http://portail.bastamag.net/spip.php?page=gis_json&objets=syndic_articles&limit=500',
      // offline ? 'data/map/map_circc.json':'http://www.circuits-courts.be/get_json_data.php?data=ext',
      'data/map/map_ffdn.json':'https://db.ffdn.org/isp/map_data.json',
      'data/map/map_passeco.geojson':'http://www.ecovillageglobal.fr/spip.php?page=gis_json&objets=annonces&limit=500',
      'data/map/map_report.geojson':'http://reporterre.net/spip.php?page=gis_json&objets=articles&limit=500',
      'data/map/map_collec.geojson':'https://framacarte.org/fr/datalayer/5289/',
      'data/map/map_cnlii.geojson':'https://umap.openstreetmap.fr/fr/datalayer/91000/'
      //'data/map/_map_horstafta.json':'https://www.monquartier-horstafta.org/?q=maptaftajson'
      // 'communecter': {
      //   src: {
      //     url: 'http://qa.communecter.org/network/search/simplyautocomplete',
      //     method: 'POST',
      //     body: 'locality=&searchType%5B%5D=organizations&searchBy=INSEE&indexMin=0&indexMax=2000&sourceKey%5B%5D=BretagneTelecom'
      //   },
      //   dest:'data/map/map_communecter.json'
      // }
    }


  });
  
  grunt.loadNpmTasks('grunt-ng-constant');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-copy' );
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-strip');
  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-curl');
  
  // outputs json list of files in folder
  grunt.loadNpmTasks('grunt-tree');

  //grunt.registerTask('prod',    ['ngconstant:production', 'execute','jshint','env:prod','less:prod','concat:js','concat:css','copy','strip','uglify','preprocess:prod']);

  // we first set constants to prod to build, then go back to dev
  grunt.registerTask('default', ['ngconstant:production','jshint','env:prod','less:prod','concat:js','concat:css','copy','strip','uglify','preprocess:prod','ngconstant:development']);
  grunt.registerTask('map',['curl']);

};