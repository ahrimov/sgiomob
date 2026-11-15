const appVersion = '2.0.2';

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
    initNetworkTileMode();
    initial()
}

window.addEventListener("orientationchange", transformUIToOrientation);
