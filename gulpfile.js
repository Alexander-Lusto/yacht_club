import gulp from 'gulp';
import plumber from 'gulp-plumber';
import sourcemap from 'gulp-sourcemaps';
import scss from 'sass';
import gulpSass from 'gulp-sass';
import postcss from 'gulp-postcss';
import csso from 'postcss-csso';
import autoprefixer from 'autoprefixer';
import sync from 'browser-sync';
import rename from 'gulp-rename';
import htmlmin from 'gulp-htmlmin';
import imagemin from 'gulp-imagemin';
import mozjpeg from 'imagemin-mozjpeg';
import optipng from 'imagemin-optipng';
import svgo from 'imagemin-svgo';
import {deleteSync, deleteAsync} from 'del';

const sass = gulpSass(scss);

//styles
const styles = () => {
  return gulp.src('source/sass/style.scss')
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer(), csso()]))
    .pipe(rename('style.min.css'))
    .pipe(sourcemap.write('../css'))
    .pipe(gulp.dest('build/css'))
    .pipe(sync.stream())
}
export { styles };

//images
const optimizeImages = () => (
  gulp.src('source/img/**/*.{jpg,png,svg}')
    .pipe(imagemin([
      mozjpeg({ progressive: true }), // quality: 75
      optipng({ optimizationLevel: 3 }),
      svgo([
        'svgo',
        {
          plugins: [
            {
              name: 'removeViewBox',
              active: false
            },
          ],
        },
      ])
    ]))
    .pipe(gulp.dest('build/img'))
);
export { optimizeImages };

//server
const server = (done) => {
  sync.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

//watcher
const watcher = () => {
  gulp.watch('source/sass/**/*.scss', gulp.series(styles));
  gulp.watch('source/*.html').on('change', gulp.series(minifyHTML));
  gulp.watch('source/*.html').on('change', sync.reload);
}

// htmlmin
const minifyHTML = async () => {
  gulp.src('source/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('build'))
}
export { minifyHTML };

// clean
const clean = () => {
  return deleteAsync(['build']);
}
export { clean };

//build
const build = gulp.series(
  clean,
  gulp.parallel(
    styles,
    minifyHTML,
    optimizeImages)
)
export { build };

export default gulp.series(styles, server, watcher);
