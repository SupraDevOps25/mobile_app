const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so Metro sees any shared packages added later
config.watchFolders = [monorepoRoot];

// Resolve node_modules from both the app and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Silence a harmless Metro config-validation warning: @expo/metro-config sets
// `watcher.unstable_workerThreads`, but the bundled Metro version doesn't list
// that key in its schema, so it logs "Unknown option" on every build. Deleting
// it reverts to Metro's own default (the feature was already disabled anyway).
if (config.watcher && "unstable_workerThreads" in config.watcher) {
  delete config.watcher.unstable_workerThreads;
}

module.exports = withNativewind(config);
