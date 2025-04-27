const fs = require('fs');
const path = require('path');

// Create a webpack configuration file
const content = `
module.exports = {
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      util: require.resolve('util/'),
      path: require.resolve('path-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false
    },
  },
};
`;

fs.writeFileSync(path.join(__dirname, 'webpack.config.js'), content);
console.log('Webpack config created successfully');