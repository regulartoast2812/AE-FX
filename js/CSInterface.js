// Minimal CEP CSInterface implementation for this panel.
// Uses Adobe CEP's native window.__adobe_cep__ bridge when running inside After Effects.
(function () {
  if (window.CSInterface) return;

  window.SystemPath = {
    USER_DATA: 'userData',
    COMMON_FILES: 'commonFiles',
    MY_DOCUMENTS: 'myDocuments',
    APPLICATION: 'application',
    EXTENSION: 'extension',
    HOST_APPLICATION: 'hostApplication'
  };

  window.CSInterface = function () {};

  window.CSInterface.prototype.evalScript = function (script, callback) {
    if (window.__adobe_cep__ && window.__adobe_cep__.evalScript) {
      window.__adobe_cep__.evalScript(script, callback || function () {});
      return;
    }
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.tntAE) {
      window.__tntNativeCallbacks = window.__tntNativeCallbacks || {};
      window.__tntNativeRequestId = (window.__tntNativeRequestId || 0) + 1;
      var requestId = String(window.__tntNativeRequestId);
      window.__tntNativeCallbacks[requestId] = callback || function () {};
      window.webkit.messageHandlers.tntAE.postMessage({
        id: requestId,
        script: String(script || '')
      });
      return;
    }

    console.warn('CSInterface mock. Script not sent to AE:', script);
    if (callback) callback(JSON.stringify({ ok: false, error: 'Not running inside CEP/After Effects.' }));
  };

  window.CSInterface.prototype.getSystemPath = function (pathType) {
    if (window.__adobe_cep__ && window.__adobe_cep__.getSystemPath) {
      return window.__adobe_cep__.getSystemPath(pathType);
    }
    if (pathType === window.SystemPath.EXTENSION && window.__TNT_EXTENSION_PATH__) {
      return window.__TNT_EXTENSION_PATH__;
    }
    return '';
  };

  window.CSInterface.prototype.registerKeyEventsInterest = function (keyEventsInterest) {
    if (window.__adobe_cep__ && window.__adobe_cep__.registerKeyEventsInterest) {
      return window.__adobe_cep__.registerKeyEventsInterest(keyEventsInterest);
    }
    return null;
  };

  window.__tntNativeResolve = function (requestId, result) {
    var callbacks = window.__tntNativeCallbacks || {};
    var callback = callbacks[String(requestId)];
    if (!callback) return;
    delete callbacks[String(requestId)];
    callback(String(result == null ? '' : result));
  };

  window.__tntNativeResize = function (width, height) {
    if (!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.tntWindow)) return;
    window.webkit.messageHandlers.tntWindow.postMessage({
      action: 'resize',
      width: Number(width || 0),
      height: Number(height || 0)
    });
  };

  window.__tntNativeClose = function () {
    if (!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.tntWindow)) return;
    window.webkit.messageHandlers.tntWindow.postMessage({ action: 'close' });
  };
})();
