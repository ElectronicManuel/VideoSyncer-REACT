/*import * as gulp from 'gulp';
import * as del from 'del';
import * as jsonFormat from 'gulp-json-format';
import * as webpackStream from 'webpack-stream';
import * as glob from 'glob';
import * as path from 'path';
import * as UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import * as yargs from 'yargs';
import * as merge from 'gulp-merge-json';
import * as fs from 'fs';
import * as replace from 'gulp-replace';*/
const gulp = require('gulp');
const del = require('del');
const jsonFormat = require('gulp-json-format');
const webpackStream = require('webpack-stream');
const glob = require('glob');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const yargs = require('yargs');
const merge = require('gulp-merge-json');
const fs = require('fs');
const replace = require('gulp-replace');

import { config } from './config';

const argv = yargs.option('target', {
        alias: 't',
        describe: 'Choose build target',
        type: 'string',
        choices: ['chrome', 'firefox', 'opera'],
        default: 'chrome'
    })
    .option('release', {
        alias: 'r',
        describe: 'Version to build',
        type: 'string',
        default: '0.0.0'
    })
    .option('watch', {
        alias: 'w',
        describe: 'Watch files for changes',
        type: 'boolean',
        default: false
    })
    .option('production', {
        alias: 'prod',
        describe: 'Build in production mode?',
        type: 'boolean',
        default: false
    })
    .argv;


const version: string = argv.release;
const production: boolean = argv.production;
const target: string = argv.target;
const watch: boolean = argv.watch;

const baseDist = `dist/${target}/`;

export const clean = () => {
    return del([baseDist]);
};

export const merge_manifests = () => {
    return gulp.src(`src/manifest.${argv.target}.json`)
        .pipe(merge({
            fileName: 'manifest.json',
            startObj: JSON.parse(fs.readFileSync('src/manifest.json').toString('utf-8'))
        }))
        .pipe(replace('@@VS_version', version))
        .pipe(gulp.dest(baseDist));
}

export const copy_files = () => {
    return gulp.src([
        'src/**/*.html',
        'src/**/*.css',
        'src/**/*.png',
        'src/**/*.svg',
    ])
            .pipe(replace('@@VS_version', version))
            .pipe(gulp.dest(baseDist));
}

export const copy_locales = () => {
    return gulp.src('src/_locales/**/*.json')
        .pipe(replace('@@VS_version', version))
        .pipe(gulp.dest(baseDist+'_locales'));
}

export const webpack_task = () => {
        const fileEndings = [
            '.entry.jsx',
            '.entry.tsx',
            '.entry.js',
            '.entry.ts'
        ]
    
        // map files
        const entryArray = glob.sync('./src/**/*.entry.*');
        const entryObject = entryArray.reduce((acc, item) => {
            let name = item.replace('./src/', '');
            fileEndings.forEach(ending => {
                name = name.replace(ending, '.js');
            })
            acc[name] = item;
            return acc;
        }, {});
    
        const webpackConfig: any = {
            entry: entryObject,
            mode: argv.production ? 'production' : 'development',
            output: {
                filename: '[name]',
            },
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.jsx']
            },
            module: {
                rules: [
                    {
                        test: /\.(ts|tsx|js|jsx)$/,
                        exclude: /node_modules/,
                        use: 'ts-loader'
                    },
                    {
                        test: /\.css$/,
                        use: ['style-loader', 'css-loader']
                    },
                    {
                        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                        use: 'url-loader'
                    }
                ]
            }
        };
    
        if (argv.production) {
            webpackConfig.plugins = [
                new UglifyJsPlugin({
                    parallel: true
                })
            ];
        } else {
            webpackConfig.devtool = 'source-map'
        }
    
        return gulp.src('./src/**/*.(js?|ts?)')
            .pipe(webpackStream(webpackConfig, require('webpack')))
            .pipe(gulp.dest(baseDist));
}

const defaultTask = gulp.series(clean, 
                        gulp.parallel(
                            merge_manifests,
                            copy_files,
                            copy_locales,
                            webpack_task
                        )
                    );

gulp.task('default', defaultTask);

// init args

// // BEGIN TMP

// createTask('clean', null, (target, tempDir, distDir) => {
//     return gulp.src([distDir, tempDir], {
//         read: false
//     }).pipe(clean());
// });

// createTask('raw', ['clean'], (target, tempDir, distDir) => {
//     return gulp.src('src/**/*.!(tsx|entry.tsx|ts|entry.ts|jsx|entry.jsx|js|entry.js|json|css|html)')
//         .pipe(gulp.dest(tempDir + 'src'));
// });

// createTask('ejs', ['raw'], (target, tempDir, distDir) => {
//     return gulp.src('src/**/*.@(tsx|entry.tsx|ts|entry.ts|jsx|entry.jsx|js|entry.js|json|css|html)')
//         .pipe(ejs({
//             target: target,
//             version: version,
//             production: production,
//             config: config
//         }))
//         .pipe(gulp.dest(tempDir + 'src'));
// });

// createTask('beautify-js', ['ejs'], (target, tempDir, distDir) => {
//     return gulp.src(tempDir + 'src/**/*.js')
//         .pipe(beautify({
//             indent_with_tabs: true
//         }))
//         .pipe(gulp.dest(tempDir + 'src'));
// });

// createTask('beautify-json', ['ejs'], (target, tempDir, distDir) => {
//     return gulp.src(tempDir + 'src/**/*.json')
//         .pipe(jsonFormat(4))
//         .pipe(gulp.dest(tempDir + 'src'));
// });

// createTask('tmp-locales', ['ejs'], (target, tempDir, distDir) => {
//     return gulp.src('locales/**/*.json')
//         .pipe(jsonFormat(4))
//         .pipe(gulp.dest(tempDir + 'locales'));
// })

// createTask('tmp', ['clean', 'raw', 'ejs', 'beautify-js', 'beautify-json', 'tmp-locales'], null);

// // END TMP

// // BEGIN FINAL-BUILD

// createTask('final-locales', ['tmp'], (target, tempDir, distDir) => {
//     return gulp.src(tempDir + 'locales/**/*')
//         .pipe(gulp.dest(distDir + '_locales'));
// });

// createTask('webpack', ['tmp'], (target, tempDir, distDir) => {
//     const fileEndings = [
//         '.entry.jsx',
//         '.entry.tsx',
//         '.entry.js',
//         '.entry.ts'
//     ]

//     // map files
//     const entryArray = glob.sync(tempDir + '/**/*.entry.*');
//     const entryObject = entryArray.reduce((acc, item) => {
//         let name = item.replace(tempDir + 'src/', '');
//         fileEndings.forEach(ending => {
//             name = name.replace(ending, '.js');
//         })
//         acc[name] = item;
//         return acc;
//     }, {});

//     const webpackConfig = {
//         entry: entryObject,
//         mode: argv.production ? 'production' : 'development',
//         output: {
//             filename: '[name]',
//         },
//         resolve: {
//             extensions: ['.ts', '.tsx', '.js', '.jsx']
//         },
//         module: {
//             rules: [
//                 {
//                     test: /\.(ts|tsx|js|jsx)$/,
//                     exclude: /node_modules/,
//                     use: 'ts-loader'
//                 },
//                 {
//                     test: /\.css$/,
//                     use: ['style-loader', 'css-loader']
//                 },
//                 {
//                     test: /\.(png|woff|woff2|eot|ttf|svg)$/,
//                     use: 'url-loader'
//                 }
//             ]
//         }
//     };

//     if (argv.production) {
//         webpackConfig.plugins = [
//             new UglifyJsPlugin({
//                 parallel: true
//             })
//         ];
//     } else {
//         webpackConfig.devtool = 'source-map'
//     }

//     return gulp.src(tempDir + '/src/**/*.(js?|ts?)')
//         .pipe(webpack(webpackConfig, require('webpack')))
//         .pipe(gulp.dest(distDir))
// });

// createTask('files', ['webpack'], (target, tempDir, distDir) => {
//     return gulp.src(tempDir + '/src/**/*.!(js?|ts?)')
//         .pipe(gulp.dest(distDir));
// });

// createTask('final-build', ['final-locales', 'webpack', 'files']);

// // END FINAL-BUILD

// createTask('build', ['tmp', 'final-build']);

// const buildList = [];

// if (argv.target instanceof Array) {
//     for (let target of argv.target) {
//         buildList.push('build-' + target);
//     }
// } else {
//     const target = argv.target;
//     buildList.push('build-' + target);
// }

// gulp.task('default', buildList);

// // Watch
// if (argv.watch) {
//     console.log('watching files...');
//     const watcher = gulp.watch(['src/**/*', 'locales/**/*'], ['default']);
// }