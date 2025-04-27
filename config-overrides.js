const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add Node.js polyfills
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": "crypto-browserify",
    "stream": "stream-browserify",
    "buffer": "buffer/",
    "util": "util/",
    "path": "path-browserify",
    "http": "stream-http",
    "https": "https-browserify",
    "os": "os-browserify/browser",
    "fs": false,
    "net": false,
    "tls": false,
    "dns": false,
    "child_process": false
  };
  
  // Add plugin for Buffer
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  );

  return config;
};
