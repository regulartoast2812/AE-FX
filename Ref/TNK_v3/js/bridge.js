// cs-interface bridge wrapper
// Thin wrapper so index.html can call AE cleanly

var TNK = (function () {
  var cs = new CSInterface();

  function run(fn, args, callback) {
    // Build a call string: fn(arg1, arg2, ...)
    var argStr = args
      ? args.map(function (a) { return JSON.stringify(a); }).join(",")
      : "";
    var call = fn + "(" + argStr + ")";
    cs.evalScript(call, function (result) {
      if (callback) callback(result);
    });
  }

  // Close the panel after a short delay
  function closePanel(delay) {
    setTimeout(function () {
      cs.closeExtension();
    }, delay || 120);
  }

  return {
    run: run,
    closePanel: closePanel,
    cs: cs
  };
})();
