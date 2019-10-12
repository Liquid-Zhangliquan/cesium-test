const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
let cesiumSource = './node_modules/cesium/Source'
let cesiumWorkers = '../Build/Cesium/Workers'

module.exports = {
  publicPath: '',
  pages: {
    index: {
      entry: 'src/main.js',
    }
  },
  configureWebpack: {
    output: {
      sourcePrefix: ' '
    },
    amd: {
      toUrlUndefined: true
    },
    resolve: {
      // 设置别名
      alias: {
        'cesium': path.resolve(__dirname, cesiumSource)
      }
    },
    plugins: [
      new CopyWebpackPlugin([{ from: path.join(cesiumSource, cesiumWorkers), to: 'Workers' }]),
      new CopyWebpackPlugin([{ from: path.join(cesiumSource, 'Assets'), to: 'Assets' }]),
      new CopyWebpackPlugin([{ from: path.join(cesiumSource, 'Widgets'), to: 'Widgets' }]),
      new CopyWebpackPlugin([{ from: path.join(cesiumSource, 'ThirdParty/Workers'), to: 'ThirdParty/Workers' }]),
      new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify('./')
      })
    ],
  },
  devServer: {
    proxy: {
      '/srtm_60_05': {
        target: 'http://localhost:8082/srtm_60_05',
        ws: true,
        changeOrigin: true,
        pathRewrite: {
          '^/srtm_60_05': ''
        }
      },
      '/cva_w': {
        target: 'http://t0.tianditu.com/cva_w',
        ws: true,
        changeOrigin: true,
        pathRewrite: {
          '^/cva_w': ''
        }
      },
      '/maps': {
        target: 'http://www.google.cn/maps',
        ws: true,
        changeOrigin: true,
        pathRewrite: {
          '^/maps': ''
        }
      },
    }
  }
}