// jest.resolver.cjs
module.exports = function customResolver(request, options) {
  const def = options.defaultResolver;

  // Solo tocar imports relativos que acaban en .js
  const isRelativeJs = request.startsWith(".") && request.endsWith(".js");
  if (isRelativeJs) {
    const asTs = request.replace(/\.js$/, ".ts");
    try { return def(asTs, options); } catch (_) { }

    // (Si algún día hubiese index.ts)
    const asIndexTs = request.replace(/\.js$/, "/index.ts");
    try { return def(asIndexTs, options); } catch (_) { }
  }

  return def(request, options);
};
