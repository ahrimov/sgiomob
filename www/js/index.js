document.addEventListener('deviceready', onDeviceReady, false);

var layers = []
var features = []

var db, dbMetaData, currentMapView;

var pathToImageStorage;

var pathToKMLStorage;

var gps_position;

let navigationMode = NAVIGATION_MODE.DISABLED;

let needsCancelNavigator = false;

let hasGeolocationPermission = false;

var map = new ol.Map();

var raster = new ol.layer.Tile({
  source: new ol.source.OSM({})
});
raster.visible = true
raster.isLocal = false

var localSource;

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
