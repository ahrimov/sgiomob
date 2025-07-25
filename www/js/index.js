const appVersion = '1.0.3';

let updateAppMode = false;

const versionFileName = 'version.txt';

document.addEventListener('deviceready', onDeviceReady, false);

var layers = []
var features = []

let db, dbMetaData, currentMapView;

var pathToImageStorage;

var pathToKMLStorage;

var gps_position;

let navigationMode = NAVIGATION_MODE.DISABLED;

let needsCancelNavigator = false;

let hasGeolocationPermission = false;

let hasExternalStoragePermissions = false;

let map = new ol.Map();

let numberNodesOnMap = defaultNumberNodesOnMap;

// Растровая подложка
let baseRasterLayers = [];

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    initial()
}

window.fn = {};
        
window.fn.openMenu = function() {
  var menu = document.getElementById('menu');
  menu.open();
};

window.fn.load = function(page) {
  document.querySelector('#myNavigator').pushPage(page)
  var menu = document.getElementById('menu');
  menu.close()
};

window.addEventListener("orientationchange", transformUIToOrientation);
