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

var root_directory = "file:///storage/self/primary/Android/data/io.cordova.sgiomob/Project/";
const media_directory = "file:///storage/self/primary/Android/media/io.cordova.sgiomob/";

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

window.addEventListener("orientationchange", function(){
  switch(screen.orientation.type){
    case 'portrait-primary':
    case 'portrait-secondary':
      portraitMode();
      break;
    case 'landscape-primary':
    case 'landscape-secondary':
      landscapeMode();
      break;
    default:
      break;
  }
});

function portraitMode(){
  document.getElementById('zoom-plus').style.top = '75%';
  document.getElementById('zoom-minus').style.top = '82%';
  document.getElementById('draw-button').style.top = '90%';
  document.getElementById('accept-draw-button').style.top = '90%';
  document.getElementById('gps-button').style.top = '83%';
  document.getElementById('tile-status-bar').style.top = '90%';
  document.getElementById('draw-button').style.top = '90%';
}

function landscapeMode(){
  document.getElementById('zoom-plus').style.top = '46%';
  document.getElementById('zoom-minus').style.top = '62%';
  document.getElementById('draw-button').style.top = '78%';
  document.getElementById('accept-draw-button').style.top = '78%';
  document.getElementById('gps-button').style.top = '63%';
  document.getElementById('tile-status-bar').style.top = '78%';
}





