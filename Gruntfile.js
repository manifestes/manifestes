module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

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
            disquskey: 'OqPLew400064q8tSFhTrqowfNxZC9jR2Lit9A9Pe1Xwej5M83vVu1cILYamM5cbG',
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
            disquskey: 'OqPLew400064q8tSFhTrqowfNxZC9jR2Lit9A9Pe1Xwej5M83vVu1cILYamM5cbG',
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
          "src/css/styles.css": "src/css/styles.less"
        }
      }
    },

    concat: {
      options: {
        separator: '\n;\n\n'
      },
      css: {
        src: [
          'src/vendor/normalize.css/normalize.css',
          'src/vendor/animate.css/animate.min.css',
          'src/css/styles.css'
        ],
        dest: 'build/css/<%= pkg.name %>.css'
      },
      js: {
        src: [
          'src/vendor/underscore/underscore-min.js',
          'src/vendor/angular/angular.min.js',
          'src/vendor/angular-sanitize/angular-sanitize.min.js',
          'src/vendor/angular-route/angular-route.min.js',
          //'src/vendor/angular-touch/angular-touch.min.js',
          //'src/vendor/ngScroll/ngscroll.min.js',
          'src/vendor/fastclick/lib/fastclick.js',
          //'src/vendor/angular-animate/angular-animate.min.js',
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
                }
            ]
        }
    },

    preprocess : {
      prod : {
        src : 'src/index.html',
        dest : 'index.html'
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

  //grunt.registerTask('prod',    ['ngconstant:production', 'execute','jshint','env:prod','less:prod','concat:js','concat:css','copy','strip','uglify','preprocess:prod']);

  // we first set constants to prod to build, then go back to dev
  grunt.registerTask('default', ['ngconstant:production','jshint','env:prod','less:prod','concat:js','concat:css','copy','strip','uglify','preprocess:prod','ngconstant:development']);

};