const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '3000', 10);
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || '3001', 10);
const BACKEND_HOST = `http://localhost:${BACKEND_PORT}`;

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      API_URL: JSON.stringify(process.env.API_URL || BACKEND_HOST),
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    historyApiFallback: true,
    port: FRONTEND_PORT,
    hot: true,
    proxy: [
      {
        context: ['/api'],
        target: BACKEND_HOST,
        pathRewrite: { '^/api': '' },
      },
      {
        context: ['/uploads'],
        target: BACKEND_HOST,
      },
    ],
  },
};
