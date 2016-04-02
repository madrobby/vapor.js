module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    babel: {
      dist: {
        src: ['vapor.js'],
        dest: 'vapor.js'
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['vapor.js'],
        dest: 'vapor.js'
      }
    },
    uglify: {
      dist: {
        files: {
          '<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    qunit: {
      files: ['test.html']
    },
    jshint: {
      files: ['Gruntfile.js']
    }
  });

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('test', ['jshint', 'qunit']);
  grunt.registerTask('default', ['jshint', 'qunit', 'babel', 'concat', 'uglify']);
  grunt.registerTask('build', ['babel', 'concat', 'uglify']);

};
