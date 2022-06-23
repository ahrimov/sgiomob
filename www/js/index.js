document.addEventListener('deviceready', onDeviceReady, false);

var layers = []
var features = []

var db;

var map = new ol.Map();

var root_directory = "file:///storage/self/primary/Android/data/io.cordova.sgiomob/"

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
  var content = document.getElementById('content');
  var menu = document.getElementById('menu');
  content.load(page)
    .then(menu.close.bind(menu));
};
