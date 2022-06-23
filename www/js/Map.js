function showMap(){
    var raster = new ol.layer.Tile({
        source: new ol.source.OSM({})
    });
    map = new ol.Map({
        target: 'map-container',
        layers: [raster],
        view: new ol.View({
          center: ol.proj.fromLonLat([55.4362, 58.7667]),
          zoom: 5,
          minZoom: 1,
          maxZoom: 20
        }),
    });
    for(layer of layers){
        map.addLayer(layer)
    }

}

