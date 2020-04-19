var gulp = require('gulp'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	cssmin = require('gulp-cssmin'),
	sass   = require('gulp-sass'),
	del    = require('del');

var paths = {
	prefix: 'frameplayer.min',
	build: 'dist',
	src  : 'src',
	js: ['src/*.js'],
	css: ['src/*.css'],
	scss: ['src/scss/*.scss']
};

gulp.task('clean', function(cb) {
  del(paths.build, cb);
});

gulp.task('js', ["clean"], function() {
	return gulp.src(paths.js)
		.pipe(uglify())
		.pipe(concat(paths.prefix + '.js'))
		.pipe(gulp.dest(paths.build));
});

gulp.task('css', ["clean"], function() {
    return gulp.src(paths.css)
		.pipe(cssmin())
		.pipe(concat(paths.prefix +  '.css'))
		.pipe(gulp.dest(paths.build));
});

sass.compiler = require('node-sass');
gulp.task('sass', ["clean", "css"], function () {
	return gulp.src(paths.scss)
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest(paths.src));
});

// Watch
gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['js']);
  gulp.watch(paths.styles, ['css']);
  gulp.watch(paths.scss, ['sass']);
});

// Build
gulp.task('default', ['clean', 'js', 'sass', 'css']);
