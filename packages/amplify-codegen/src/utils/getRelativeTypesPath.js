const path = require('path');

function getRelativeTypesPath(opsGenDirectory, generatedFileName) {
  if (generatedFileName) {
    const relativePath = path
      .relative(opsGenDirectory, generatedFileName)
      // ensure posix path separators are used
      .split('\\')
      .join(path.posix.sep);

    // generatedFileName is in same directory as opsGenDirectory
    // i.e. generatedFileName: src/graphql/API.ts, opsGenDirectory: src/graphql
    if (!relativePath.startsWith('.')) {
      // path.join will strip prefixed ./
      return `./${relativePath}`;
    }

    return relativePath;
  }
  return null;
}

module.exports = getRelativeTypesPath;
