// 实现这个项目的构建任务
const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del');
const loadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync');

// 加载所有插件
const plugins = loadPlugins();
// 创建开发服务器实例
const bs = browserSync.create();

// 清除文件任务
const clean = () => {
    return del(['dist', 'temp'])
}

// 编译scss
const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
        .pipe(plugins.sass({ outputStyle: 'expended' }))
        .pipe(dest('temp'))
        .pipe(bs.reload({ stream: true }))
}

// lint js
const lint = () => {
    return src('src/assets/scripts/*.js', { base: 'src' })
        // eslint（）将lint输出附加到“eslint”属性 以供其它模块使用
        .pipe(plugins.eslint())
        // format（）将lint结果输出到控制台。
        // 或者使用eslint.formatEach（）（参见文档）。
        .pipe(plugins.eslint.format())
        // 使进程退出时具有错误代码（1）
        // lint错误，最后将流和管道返回failAfterError。
        .pipe(plugins.eslint.failAfterError());
}

// 编译js
const script = () => {
    return src('src/assets/scripts/*.js', { base: 'src'})
        .pipe(plugins.babel({ presets: ['@babel/preset-env']}))
        .pipe(dest('temp'))
        .pipe(bs.reload({ stream: true }))
}

const lintAndCompileScript = series(lint, script);

const data = {
    menus: [{
        name: '主页',
        link: '/'
    },{
        name: '关于',
        link: '/about.html'
    }],
    title: 'gulp样板页面',
    pkg: require('./package.json'),
    dete: new Date()
}
// 编译模板
const page = () => {
    return src('src/**/*.html', { base: 'src' })
        .pipe(plugins.swig({data}))
        .pipe(dest('temp'))
        .pipe(bs.reload({ stream: true }))
}

// 图片转换
const image = () => {
    return src('src/assets/images/**', { base: 'src' })
        .pipe(plugins.imagemin())
        .pipe(dest('dist'))
}

// 压缩字体
const font = () => {
    return src('src/assets/fonts/**', { base: 'src' })
        .pipe(plugins.imagemin())
        .pipe(dest('dist'))
}

// 复制public目录资源
const extra = () => {
    return src('public/**', { base: 'public' })
        .pipe(dest('dist'))
}

// 开发服务器
const startDevServer = () => {
    watch('src/assets/scripts/*.js', lintAndCompileScript);
    watch('src/assets/styles/*.scss', style);
    watch('src/**/*.html', page);
    watch([
        'src/assets/images/**',
        'src/assets/fonts/**',
        'public/**'
    ], bs.reload)

    bs.init({
        notify: false,
        port: 3001,
        server: {
            baseDir: ['temp', 'src', 'public'],
            routes: {
                '/node_modules': 'node_modules'
            }
        }
    })
}

// 合并文件
const useref = () => {
    return src('temp/**/*.html', { base: 'temp' })
        .pipe(plugins.useref({ searchPath: ['temp', '.']}))
        .pipe(plugins.if(/\.js$/, plugins.uglify()))
        .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
        .pipe(plugins.if(/\.html$/, plugins.htmlmin({
            collapseWhitespace: true,
            minifyCss: true,
            minigyJS: true
        })))
        .pipe(dest('dist'))
}

// 组合任务编译src
const compileSrc = parallel(lintAndCompileScript, style, page)

// 生产构建
const build = series(
    clean,
    parallel(
        series(compileSrc, useref),
        image,
        font,
        extra
    )
)

// 开发构建并启动服务
const serve = series(compileSrc, startDevServer);

// 启动生产模式服务
const startProdServer = () => {
    bs.init({
        notify: false,
        port: 3002,
        server: {
            // 服务器根目录
            baseDir: ['dist'],
            // 引用路径替换
            routes: {
                '/node_modules': 'node_modules'
            }
        }
    })
}

// 生产模式启动项目
const start = series(build, startProdServer);

// "clean": "gulp clean",       -> 清除temp和dist目录文件
// "lint": "gulp lint",         -> lint scipts
// "serve": "gulp serve",       -> 开发模式启动app并启动一个自动更新的web服务
// "build": "gulp build",       -> 生产模式构建项目并且输出到dist目录
// "start": "gulp start",       -> 生产模式启动项目
module.exports = {
    clean,
    lint,
    serve,
    build,
    start,
}