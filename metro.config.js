const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const rnWebPath = path.resolve(__dirname, 'node_modules/react-native-web');
const rnPath = path.resolve(__dirname, 'node_modules/react-native');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Redirect top-level react-native to react-native-web
    if (moduleName === 'react-native') {
      return {
        filePath: path.join(rnWebPath, 'dist/cjs/index.js'),
        type: 'sourceFile',
      };
    }

    // If a file inside react-native/Libraries/... does a relative require,
    // context.originModulePath will be inside rnPath. Redirect internal
    // react-native requires to react-native-web shims where possible.
    if (
      context.originModulePath &&
      context.originModulePath.startsWith(rnPath) &&
      moduleName.startsWith('.') &&
      !context.originModulePath.startsWith(rnWebPath)
    ) {
      const absPath = path.resolve(
        path.dirname(context.originModulePath),
        moduleName
      );
      const relFromRn = path.relative(rnPath + '/Libraries', absPath);
      const segments = relFromRn.split(path.sep);
      const topLevel = segments[0];

      // Attempt to find a matching react-native-web export
      const rnwExport = path.join(rnWebPath, 'dist/cjs/exports', topLevel, 'index.js');
      try {
        require.resolve(rnwExport);
        return { filePath: rnwExport, type: 'sourceFile' };
      } catch (_) {}
    }
  }

  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
