const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

process.env.BABEL_CONFIG_FILE = path.resolve(__dirname, 'b.config.js');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('lodash/')) {
    const fn = moduleName.replace('lodash/', '');
    return {
      filePath: require.resolve(`lodash/${fn}`),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
