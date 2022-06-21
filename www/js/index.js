document.addEventListener('deviceready', onDeviceReady, false);

var layers = []
var features = []

var db, map

var root_directory = "file:///storage/self/primary/Android/data/io.cordova.sgiomob/"

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    initial()
}
