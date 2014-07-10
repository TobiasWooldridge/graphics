var gulp = require('gulp'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    notify = require('gulp-notify'),
    imagemin = require('gulp-imagemin'),
    less = require('gulp-less'),
    traceur = require('gulp-traceur'),
    connect = require('gulp-connect');

gulp.task('styles', function() {
    return gulp.src('src/css/*.*ss')
        .pipe(less())
        .pipe(rename({extname: ".css"}))
        .pipe(gulp.dest('dist/css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest('dist/css'))
        .pipe(connect.reload());
});

gulp.task('vendors', function() {
    gulp.src(['vendor/*.js'])
        .pipe(gulp.dest('dist/vendor/js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('dist/vendor/js'))
        .pipe(connect.reload());
});

gulp.task('scripts', function() {
    return gulp.src('src/js/**/*.js*')
        .pipe(traceur({sourceMap: true}))
//        .pipe(jshint('.jshintrc'))
//        .pipe(jshint.reporter('default'))
        .pipe(gulp.dest('dist/js'))
        .pipe(connect.reload());
//        .pipe(rename({suffix: '.min'}))
//        .pipe(uglify())
//        .pipe(gulp.dest('dist/js'));
});

gulp.task('textures', function() {
    return gulp.src('src/textures/**/*')
        .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
        .pipe(gulp.dest('dist/textures'))
        .pipe(connect.reload());
});

gulp.task('html', function() {
    return gulp.src('src/index.html')
        .pipe(gulp.dest('dist'));
});

gulp.task('objects', function() {
    return gulp.src('src/objects/*')
        .pipe(gulp.dest('dist/objects/'));
});

gulp.task('clean', function() {
    return gulp.src(['dist/css', 'dist/js', 'dist'], {read: false})
        .pipe(clean());
});

gulp.task('default', ['clean'], function() {
    return gulp.start('html', 'styles', 'scripts', 'vendors', 'textures', 'objects');
});

gulp.task('connect', function() {
    connect.server({
        root: 'dist',
        livereload: true
    });
});

gulp.task('watch', ['connect'], function() {
    gulp.watch('src/css/**/*', ['styles']);
    gulp.watch('src/js/**/*', ['scripts']);
    gulp.watch('src/textures/**/*', ['textures']);
    gulp.watch('src/**/*.html', ['html']);

    gulp.start('default');
});

