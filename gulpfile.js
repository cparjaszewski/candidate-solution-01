'use strict';

const paths = {
                dist: "./dist",
                source: "./src"
};

const config = {
                sass:           {
                                    errLogToConsole: true,
                                    outputStyle: 'compressed'
                                },
                autoprefixer:   {
                                    browsers: ['last 4 versions'],
                                    cascade: true
                                },
                html:           {
                                    comments: false,
                                    spare: true
                                },
                babel:          {
                                    presets: ["env"],
                                    plugins: ["transform-regenerator"],
                                }
};

const gulp = require('gulp'),
    gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    autoprefixer = require('gulp-autoprefixer'),
    minifyHTML = require('gulp-minify-html'),
    babel = require('gulp-babel'),
    http = require('http'),
    open = require('open'),
    staticfile = require('node-static'),
    webpack = require('webpack');

var myfile = new staticfile.Server(paths.dist);
gulp.task('default', ['webpack','pages','server']);
  
gulp.task('server', () => {
    http.createServer(function (request, response) {
        request.addListener('end', function () {
            myfile.serve(request, response);
        }).resume();
    }).listen(8080,"localhost",function(){
        console.log('Server is running on http://localhost:8080');
        open('http://localhost:8080');
    });
});

gulp.task('copyHtml', () => {
    gulp.src(paths.source+'/**/*.html')
        .pipe(minifyHTML(config.html))
        .pipe(gulp.dest(''+paths.dist+''));
});

gulp.task('copyLib', () => {
    gulp.src(paths.source+'/es/lib/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(''+paths.dist+'/js/lib/'));
});

gulp.task('sass', () => {
    gulp.src(paths.source+'/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass(config.sass).on('error', handleError))
        .pipe(autoprefixer(config.autoprefixer))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dist+'/css'));
});

gulp.task('uglify-js', () => {
    gulp.src(paths.source+'/js/*.js')
        .pipe(sourcemaps.init())
        .pipe(concat('script.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dist+'/js'));
});

gulp.task("ecmascript", () => {
    gulp.src(paths.source+'/es/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel(config.babel)).on('error', handleError)
        .pipe(concat('script.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dist+'/js'));
});

gulp.task('pages', () => {
    gulp.watch(paths.source+'js/lib/**/*.js', ['copyLib']);
    gulp.watch(paths.source+'/**/*.html', ['copyHtml']);
    gulp.watch(paths.source+'/scss/**/*.scss', ['sass']);
    gulp.watch(paths.source+'/es/*.js', ['webpack']);
    // gulp.watch(paths.source+'/js/**/*.js', ['uglify-js']);
});

gulp.task('webpack', function(done) {
  webpack({
    entry: './src/es/script.js',
    output: {
      path: __dirname + '/dist/js',
      filename: 'script.js'
    },
    module: {
      loaders: [
        { 
            test: /\.js?$/, 
            loader: 'babel-loader', 
            options: {
                presets: ['env']
            },
            exclude: /node_modules/
        }
      ]
    }
  }, function(error) {
    var pluginError;
    if(error)
    {
        pluginError = new gulpUtil.PluginError('webpack', error);
 
        if (done)
        {
            done(pluginError);
        } else
        {
            gulpUtil.log('[webpack]', pluginError);
        }
 
      return;
    }
    if(done)
    {
      done();
    }
  });
});

function handleError(err) {
    gutil.beep();
    gutil.log('Error!', gutil.colors.red(err.toString()));
    gutil.beep();
    this.emit('end');
}