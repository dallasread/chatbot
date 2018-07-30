var MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    mode = process.argv.indexOf('-p') !== -1 ? 'production' : 'development';

var js = {
    mode: mode,
    entry: ['./index.js'],
    output: {
        path: __dirname + '/docs/assets',
        filename: 'application.min.js'
    },
    module: {
        rules: [
            // { test: /\.json$/, loader: 'json-loader' },
            { test: /\.html$/, loader: 'html-loader?minimize=false' },
            { test: /\.png$/,  loader: 'url-loader?mimetype=image/png' },
            { test: /\.gif$/,  loader: 'url-loader?mimetype=image/gif' },
            { test: /\.svg$/,  loader: 'url-loader?mimetype=image/svg+xml' },
            { test: /\.jpeg|\.jpg$/, loader: 'url-loader?mimetype=image/jpeg' }
        ],
    },
    node: {
        fs: 'empty'
    }
};

var css = {
    mode: mode,
    entry: ['./index.scss'],
    module: {
        rules: [
            {
                test: /\.scss|\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            }
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '../docs/assets/application.min.css',
        })
    ]
};

module.exports = [js, css];
