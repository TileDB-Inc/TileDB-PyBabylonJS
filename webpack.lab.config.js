const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  resolve: {
    fallback: {
      os: false,
    },
  },
  plugins: [
		new NodePolyfillPlugin()
	]
};
