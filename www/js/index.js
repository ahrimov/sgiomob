document.addEventListener('deviceready', onDeviceReady, false);

var layers = []
var features = []

var db, dbMetaData, currentMapView;

var pathToImageStorage;

var pathToKMLStorage;

var gps_position;

var map = new ol.Map();

var raster = new ol.layer.Tile({
  source: new ol.source.OSM({})
});
raster.visible = true
raster.isLocal = false

var localSource;

var root_directory = "file:///storage/self/primary/Android/data/io.cordova.sgiomob/Project/"

let numberNodesOnMap = 10000;

const globalHitTolerance = 20;

const selectedColor = "rgb(255, 153, 0)";

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





