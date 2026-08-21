// Stub for browser-only WASM packages during server-side builds
module.exports = {};
module.exports.removeBackground = async function () {
  throw new Error("This function only runs in the browser");
};
module.exports.checkBackendHealth = async function () {
  return true;
};
