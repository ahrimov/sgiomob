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

let mapContainerSecondSize = '90%';

function transformUIToOrientation(){
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
} 

window.addEventListener("orientationchange", transformUIToOrientation);



function portraitMode(){
  document.getElementById('zoom-plus').style.top = '75%';
  document.getElementById('zoom-minus').style.top = '82%';
  document.getElementById('draw-button').style.top = '90%';
  document.getElementById('accept-draw-button').style.top = '90%';
  document.getElementById('draw-button').style.left = '83%';
  document.getElementById('accept-draw-button').style.left = '83%';
  document.getElementById('gps-button').style.top = '83%';
  document.getElementById('tile-status-bar').style.top = '90%';
  document.getElementById('gps-button').style.left = '2%';
  document.getElementById('tile-status-bar').style.left = '2%';
  mapContainerSecondSize = '90%';
  let drawBar = document.querySelector('#downbar-wrapper');
  drawBar.style.height = '10%';
  if(drawBar.style["display"] === "grid"){
    openDrawBar();
    document.querySelector('.crosshair').style['top'] = '45%';
  }
  let drawInstrumentBar = document.getElementById('draw-instrument-bar');
  drawInstrumentBar.style.height = '10%';
  if(drawInstrumentBar.style["display"] === "block"){
    let mapContainer = document.querySelector('#map-container')
    mapContainer.style['height'] = mapContainerSecondSize;
    map.updateSize();
    document.querySelector('.crosshair').style['top'] = '45%';
  }
  if(document.getElementById('add-feature-content') !== null)
    document.getElementById('add-feature-content').style.height = "90%";
  if(document.getElementById('save-feature-bar') !== null)
    document.getElementById('save-feature-bar').style.height = "10%";
  if(document.getElementById('featureProperties') !== null) 
    document.getElementById('featureProperties').style.height = "90%";
  if(document.getElementById('save-modification-bar') !== null)   
    document.getElementById('save-modification-bar').style.height = "10%";
  if(document.getElementById('feature-instruments') !== null)   
    document.getElementById('feature-instruments').style.height = "10%";
  if(document.getElementById('accept-modify-button') !== null){   
    document.getElementById('accept-modify-button').style.top = '90%';
    document.getElementById('accept-modify-button').style.left = '83%';
  }
}

function landscapeMode(){
  document.getElementById('zoom-plus').style.top = '42%';
  document.getElementById('zoom-minus').style.top = '60%';
  document.getElementById('draw-button').style.top = '78%';
  document.getElementById('accept-draw-button').style.top = '78%';
  document.getElementById('draw-button').style.left = '84%';
  document.getElementById('accept-draw-button').style.left = '84%';
  document.getElementById('gps-button').style.top = '60%';
  document.getElementById('tile-status-bar').style.top = '78%';
  document.getElementById('gps-button').style.left = '1%';
  document.getElementById('tile-status-bar').style.left = '1%';
  mapContainerSecondSize = '80%';
  let drawBar = document.querySelector('#downbar-wrapper');
  drawBar.style.height = '20%';
  if(drawBar.style["display"] === "grid"){
    openDrawBar();
    document.querySelector('.crosshair').style['top'] = '40%';
  }
  let drawInstrumentBar = document.getElementById('draw-instrument-bar');
  drawInstrumentBar.style.height = '20%';
  if(drawInstrumentBar.style["display"] === "block"){
    let mapContainer = document.querySelector('#map-container');
    mapContainer.style['height'] = mapContainerSecondSize;
    map.updateSize();
    document.querySelector('.crosshair').style['top'] = '40%';
  }
  if(document.getElementById('add-feature-content') !== null)
    document.getElementById('add-feature-content').style.height = "80%";
  if(document.getElementById('save-feature-bar') !== null)
    document.getElementById('save-feature-bar').style.height = "20%";
  if(document.getElementById('featureProperties') !== null) 
    document.getElementById('featureProperties').style.height = "80%";
  if(document.getElementById('save-modification-bar') !== null)   
    document.getElementById('save-modification-bar').style.height = "20%";
  if(document.getElementById('feature-instruments') !== null)   
    document.getElementById('feature-instruments').style.height = "20%";
  if(document.getElementById('accept-modify-button') !== null){   
    document.getElementById('accept-modify-button').style.top = '78%';
    document.getElementById('accept-modify-button').style.left = '84%';
  }
}
