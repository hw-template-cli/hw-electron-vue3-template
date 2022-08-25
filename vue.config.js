/*
 * @Description:
 * @Author: weiyang
 * @Date: 2022-08-24 16:27:59
 * @LastEditors: weiyang
 * @LastEditTime: 2022-08-25 10:52:33
 */
"use strict"; // 严格模式
const path = require("path");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
function resolve(dir) {
  return path.join(__dirname, dir);
}
const name = "xxx";
const port = process.env.port || 80; // 定义端口

module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "/" : "/",
  // 在npm run build 或 yarn build 时 ，生成文件的目录名称（要和baseUrl的生产环境路径一致）（默认dist）
  outputDir: "dist",
  // 用于放置生成的静态资源 (js、css、img、fonts) 的；（项目打包之后，静态资源会放在这个文件夹下）
  assetsDir: "static",
  // 是否开启eslint保存检测，有效值：ture | false | 'error'
  lintOnSave: process.env.NODE_ENV === "development",
  // 如果你不需要生产环境的 source map，可以将其设置为 false 以加速生产环境构建。
  productionSourceMap: false,
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        productName: "xxx", // 项目名称
        appId: "xxx.com", // 项目包名，不要与其他项目相同
        win: {
          icon: "",
          requestedExecutionLevel: "requireAdministrator",
          target: [
            {
              target: "nsis"
            }
          ]
        },
        mac: {
          icon: ""
        },
        nsis: {
          oneClick: false, // 是否一键安装，建议为 false，可以让用户点击下一步、下一步、下一步的形式安装程序，如果为true，当用户双击构建好的程序，自动安装程序并打开，即：一键安装（one-click installer）
          perMachine: true, // 允许用户选择安装位置
          allowElevation: true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
          allowToChangeInstallationDirectory: true, // 允许修改安装目录，建议为 true，是否允许用户改变安装目录，默认是不允许
          createDesktopShortcut: true, // 创建桌面图标
          createStartMenuShortcut: true // 创建开始菜单图标
        }
      }
    }
  },
  // webpack-dev-server 相关配置
  devServer: {
    host: "0.0.0.0",
    port,
    open: true,
    proxy: {
      [process.env.VUE_APP_BASE_API]: {
        target: process.env.VUE_HTTP_URL,
        changeOrigin: true,
        pathRewrite: {
          ["^" + process.env.VUE_APP_BASE_API]: ""
        }
      }
    }
  },
  configureWebpack(config) {
    Object.assign(config, {
      name,
      target: "electron-renderer",
      resolve: {
        alias: {
          "@": resolve("src")
        }
      }
    });
    if (process.env.NODE_ENV !== "development") {
      Object.assign(config, {
        mode: "production",
        optimization: {
          minimizer: [
            new UglifyJSPlugin({
              uglifyOptions: {
                output: {
                  comments: false
                },
                compress: {
                  drop_console: true, // 删除所有调式带有console的
                  drop_debugger: true,
                  pure_funcs: ["console.log"] // 删除console.log
                }
              }
            })
          ]
        }
      });
    }
  },
  chainWebpack(config) {
    config.plugins.delete("preload"); // TODO: need test
    config.plugins.delete("prefetch"); // TODO: need test

    // set svg-sprite-loader
    config.module.rule("svg").exclude.add(resolve("src/assets/icons")).end();
    config.module
      .rule("icons")
      .test(/\.svg$/)
      .include.add(resolve("src/assets/icons"))
      .end()
      .use("svg-sprite-loader")
      .loader("svg-sprite-loader")
      .options({
        symbolId: "icon-[name]"
      })
      .end();

    // eslint-disable-next-line no-shadow
    config.when(process.env.NODE_ENV !== "development", config => {
      config
        .plugin("ScriptExtHtmlWebpackPlugin")
        .after("html")
        .use("script-ext-html-webpack-plugin", [
          {
            // `runtime` must same as runtimeChunk name. default is `runtime`
            inline: /runtime\..*\.js$/
          }
        ])
        .end();
      config.optimization.splitChunks({
        chunks: "all",
        cacheGroups: {
          libs: {
            name: "chunk-libs",
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: "initial" // only package third parties that are initially dependent
          },
          commons: {
            name: "chunk-commons",
            test: resolve("src/components"), // can customize your rules
            minChunks: 3, //  minimum common number
            priority: 5,
            reuseExistingChunk: true
          }
        }
      });
    });
  }
};
