var fs = require('fs');

var gulp = require('gulp');
var requirejs = require('requirejs');
var vinylPaths = require('vinyl-paths');
var del = require('del');
var minifyCss = require('gulp-minify-css');
var runSequence = require('run-sequence');
var merge = require('merge-stream');
var es = require('event-stream');
var hash = require('gulp-hash');
var extend = require('gulp-extend');
var replace = require('gulp-replace');
var rename = require("gulp-rename");

var production = process.env.NODE_ENV === 'production';
var configJsonPath = './config/build-config.json';

gulp.task('build', function(callback) {
    runSequence(
        'clean:build',

        ['minify-js-old', 'minify-css-old', 'copy:assets-old'],
        'hash-files-old',

        ['minify-js-new', 'minify-css-new', 'copy:assets-new'],
        'hash-files-new',

        callback
    );
});

/** Delete build folder and config file if exist **/
gulp.task('clean:build', function () {
    var buildStream = gulp.src('build')
        .pipe(vinylPaths(del));

    var configStream = gulp.src('config/build-config.json')
        .pipe(vinylPaths(del));

    return merge(buildStream, configStream);
});


/** ======================================== Old Client ======================================== **/
/** ============================================================================================ **/

/** RequireJS Optimizer options **/
var oldClientOpts = {
    baseUrl: './client_old/scripts',
    out: './build/old/scripts/main-old.js',
    name: 'lib/almond',
    mainConfigFile: './client_old/scripts/main.js',
    include: 'main',
    insertRequire: ['main'],
    removeCombined: false,
    optimize: "uglify2", //none
    generateSourceMaps: false, //TODO: true
    preserveLicenseComments: false
};

/** Minify the Javascript with requireJs optizer **/
gulp.task('minify-js-old', function(callback) {
    requirejs.optimize(oldClientOpts, function (buildResponse) {
        callback();

    }, function(err) {
        callback(err);
        console.error('[Error on require optimization]: ', err);
    });
});

/** Minify game and landing css into build dir **/
gulp.task('minify-css-old', function() {

    //Game css
    var appStream = gulp.src('client_old/css/game.css')
        .pipe(minifyCss({ advanced: false, aggressiveMerging: false, restructuring: false, shorthandCompacting: false }))
        .pipe(rename('css/game-old.css'))
        .pipe(gulp.dest('build/old/'));

    //Landing css
    var landingStream = gulp.src('client_old/css/app.css')
        .pipe(minifyCss({ compatibility: 'ie8' }))
        .pipe(rename('css/app-old.css'))
        .pipe(gulp.dest('build/old/'));

    return merge(appStream, landingStream);
});

/** Copy the necessary files to prod folder **/
gulp.task('copy:assets-old', function() {
    var imgStream = gulp.src('client_old/img/**/*.*')
        .pipe(gulp.dest('build/old/img'));
    var fontsStream = gulp.src('client_old/fonts/**/*.*')
        .pipe(gulp.dest('build/old/fonts'));
    var cssFontsStream = gulp.src('client_old/css/fonts/*.*')
        .pipe(gulp.dest('build/old/css/fonts'));
    var soundsStream = gulp.src('client_old/sounds/**/*.*')
        .pipe(gulp.dest('build/old/sounds'));
    var libStream = gulp.src('client_old/lib/**/*.*')
        .pipe(gulp.dest('build/old/lib'));

    return merge(imgStream, fontsStream, soundsStream,cssFontsStream,libStream);
});

/** Hash the config.js and the app.css files  **/
var hashOptions = {
    template: '<%= name %>-<%= hash %><%= ext %>'
};
gulp.task('hash-files-old', function(callback) {
    runSequence('hash-css-game-old', 'hash-css-app-old', 'hash-js-old', callback);
});

gulp.task('hash-css-game-old', function() {
    return addToManifest(
        gulp.src('./build/old/css/game-old.css')
            .pipe(hash(hashOptions))
            .pipe(gulp.dest('build/old/css'))
    );
});

gulp.task('hash-css-app-old', function() {
    return addToManifest(
        gulp.src('./build/old/css/app-old.css')
            .pipe(hash(hashOptions))
            .pipe(gulp.dest('build/old/css'))
    );
});

gulp.task('hash-js-old', function() {
    return addToManifest(
        gulp.src('./build/old/scripts/main-old.js')
            .pipe(hash(hashOptions))
            .pipe(gulp.dest('build/old/scripts'))
    );
});

///** Get the hashed file names of config.js and app.css **/
//var configFile = null;
//gulp.task('get-file-names', function (callback) {
//    fs.readFile('./build/build-config.json', function(err, data) {
//        if (err)
//            return callback(err);
//
//        configFile = JSON.parse(data);
//        callback();
//    });
//});


///** RequireJs Optimizer does not support an option to hash the name of the file, so we need to hash it and then replace the name of the source maps **/
//gulp.task('replace-maps-name', function(){
//
//    var replaceStream = gulp.src('./build/scripts/' + configFile['config.js'], { base: './' })
//        .pipe(replace('sourceMappingURL=config.js', 'sourceMappingURL=' + configFile['config.js']))
//        .pipe(replace('sourceMappingURL=config.js.map', 'sourceMappingURL=' + configFile['config.js'] + '.map'))
//        .pipe(gulp.dest('./'));
//
//    var mapStream = gulp.src('./build/scripts/config.js.map')
//        .pipe(rename('scripts/'+ configFile['config.js'] + '.map'))
//        .pipe(gulp.dest('./build'));
//
//    return merge(replaceStream, mapStream);
//});


/** ======================================== New Client ======================================== **/
/** ============================================================================================ **/

/** RequireJS Optimizer options **/
var newClientOptions = {
    baseUrl: './client_new/scripts',
    out: './build/scripts/main-new.js',
    name: '../../node_modules/almond/almond',
    mainConfigFile: './client_new/scripts/main.js',
    include: 'main',
    insertRequire: ['main'],
    removeCombined: false,
    optimize: "uglify2", //none
    generateSourceMaps: false, //TODO: true
    preserveLicenseComments: false
};

/** Minify the Javascript with requireJs optizer **/
gulp.task('minify-js-new', function(callback) {
    requirejs.optimize(newClientOptions, function (buildResponse) {
        callback();

    }, function(err) {
        callback(err);
        console.error('[Error on require optimization]: ', err);
    });
});

/** Minify game and landing css into build dir **/
gulp.task('minify-css-new', function() {

    //Game css
    var appStream = gulp.src('client_new/css/game.css')
        .pipe(minifyCss({ advanced: false, aggressiveMerging: false, restructuring: false, shorthandCompacting: false }))
        .pipe(rename('css/game-new.css'))
        .pipe(gulp.dest('build/'));

    //Game white theme css
    var themeStream = gulp.src('client_new/css/blackTheme.css')
        .pipe(minifyCss({ compatibility: 'ie8' }))
        .pipe(rename('css/game-theme-new.css'))
        .pipe(gulp.dest('build/'));

    //Landing css
    var landingStream = gulp.src('client_new/css/app.css')
        .pipe(minifyCss({ compatibility: 'ie8' }))
        .pipe(rename('css/app-new.css'))
        .pipe(gulp.dest('build/'));

    return merge(appStream, landingStream, themeStream);
});

/** Copy the files to prod folder **/
gulp.task('copy:assets-new', function() {
    return gulp.src('client_new/**/*.*')
        .pipe(gulp.dest('build/'));
});

/** Hash the config.js and the app.css files  **/
var hashOptions = {
    template: '<%= name %>-<%= hash %><%= ext %>'
};
gulp.task('hash-files-new', function(callback) {
    runSequence('hash-css-game-new', 'hash-css-game-theme-new', 'hash-css-app-new', 'hash-js-new', callback);
});

gulp.task('hash-css-game-new', function() {
    return addToManifest(
        gulp.src('./build/css/game-new.css')
            .pipe(hash(hashOptions))
            .pipe(gulp.dest('build/css'))
    );
});

gulp.task('hash-css-game-theme-new', function() {
    return addToManifest(
        gulp.src('./build/css/game-theme-new.css')
            .pipe(hash(hashOptions))
            .pipe(gulp.dest('build/css'))
    );
});

gulp.task('hash-css-app-new', function() {
    return addToManifest(
        gulp.src('./build/css/app-new.css')
            .pipe(hash(hashOptions))
            .pipe(gulp.dest('build/css'))
    );
});

gulp.task('hash-js-new', function() {
    return addToManifest(
        gulp.src('./build/scripts/main-new.js')
            .pipe(hash(hashOptions))
            .pipe(gulp.dest('build/scripts'))
    );
});

///** Get the hashed file names of config.js and app.css **/
//var configFile = null;
//gulp.task('get-file-names', function (callback) {
//    fs.readFile('./build/build-config.json', function(err, data) {
//        if (err)
//            return callback(err);
//
//        configFile = JSON.parse(data);
//        callback();
//    });
//});


///** RequireJs Optimizer does not support an option to hash the name of the file, so we need to hash it and then replace the name of the source maps **/
//gulp.task('replace-maps-name', function(){
//
//    var replaceStream = gulp.src('./build/scripts/' + configFile['config.js'], { base: './' })
//        .pipe(replace('sourceMappingURL=config.js', 'sourceMappingURL=' + configFile['config.js']))
//        .pipe(replace('sourceMappingURL=config.js.map', 'sourceMappingURL=' + configFile['config.js'] + '.map'))
//        .pipe(gulp.dest('./'));
//
//    var mapStream = gulp.src('./build/scripts/config.js.map')
//        .pipe(rename('scripts/'+ configFile['config.js'] + '.map'))
//        .pipe(gulp.dest('./build'));
//
//    return merge(replaceStream, mapStream);
//});




/** ======================================== Functions ========================================= **/
/** ============================================================================================ **/

// Adds the files in `srcStream` to the manifest file, extending the manifest's current contents.
function addToManifest(srcStream) {
    return es.concat(
        gulp.src(configJsonPath),
        srcStream
            .pipe(hash.manifest(configJsonPath))
    )
        .pipe(extend(configJsonPath, false, 4))
        .pipe(gulp.dest('.'));
}