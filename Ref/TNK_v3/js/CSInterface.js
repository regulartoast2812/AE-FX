/* CSInterface - v9.4.0 - Adobe Systems Incorporated - MIT License */
function CSInterface(){}
CSInterface.prototype.hostEnvironment=window.__adobe_cep__?JSON.parse(window.__adobe_cep__.getHostEnvironment()):null;
CSInterface.prototype.getHostEnvironment=function(){this.hostEnvironment=JSON.parse(window.__adobe_cep__.getHostEnvironment());return this.hostEnvironment;};
CSInterface.prototype.closeExtension=function(){window.__adobe_cep__.closeExtension();};
CSInterface.prototype.getSystemPath=function(pathType){var path=decodeURI(window.__adobe_cep__.getSystemPath(pathType));var OSVersion=this.getOSInformation();if(OSVersion.indexOf("Windows")>=0){path=path.replace("file:///","");}else{path=path.replace("file://","");}return path;};
CSInterface.prototype.evalScript=function(script,callback){if(callback===null||callback===undefined){callback=function(result){};}window.__adobe_cep__.evalScript(script,callback);};
CSInterface.prototype.getApplicationID=function(){var appInfo=this.hostEnvironment;return appInfo.appId;};
CSInterface.prototype.getHostCapabilities=function(){var hostCapabilities=JSON.parse(window.__adobe_cep__.getHostCapabilities());return hostCapabilities;};
CSInterface.prototype.dispatchEvent=function(event){if(typeof event.data=="object"){event.data=JSON.stringify(event.data);}window.__adobe_cep__.dispatchEvent(event);};
CSInterface.prototype.addEventListener=function(type,listener,obj){window.__adobe_cep__.addEventListener(type,listener,obj);};
CSInterface.prototype.removeEventListener=function(type,listener,obj){window.__adobe_cep__.removeEventListener(type,listener,obj);};
CSInterface.prototype.requestOpenExtension=function(extensionId,params){window.__adobe_cep__.requestOpenExtension(extensionId,params);};
CSInterface.prototype.getExtensions=function(extensionIds){var extensionIdsStr=JSON.stringify(extensionIds);var extensionsStr=window.__adobe_cep__.getExtensions(extensionIdsStr);return JSON.parse(extensionsStr);};
CSInterface.prototype.getNetworkPreferences=function(){var result=window.__adobe_cep__.getNetworkPreferences();return JSON.parse(result);};
CSInterface.prototype.getOSInformation=function(){var userAgent=navigator.userAgent;if(navigator.platform=="Win32"||navigator.platform=="Windows"){var winVersion="Windows";var winBit="";if(userAgent.indexOf("WOW64")!==-1){winBit=" 64-bit";}else if(userAgent.indexOf("Win64")!==-1){winBit=" 64-bit";}return winVersion+winBit;}else if(navigator.platform=="MacIntel"||navigator.platform=="Macintosh"||navigator.platform=="MacPPC"||navigator.platform=="Mac68K"){var result="Mac OS X ";var matches=userAgent.match(/Mac OS X [\d_]+/);if(matches&&matches.length>0){result=matches[0].replace(/_/g,".");}return result;}return "Unknown Operation System";};
function CSEvent(type,scope,appId,extensionId){this.type=type;this.scope=scope;this.appId=appId;this.extensionId=extensionId;};
CSEvent.prototype.data="";
