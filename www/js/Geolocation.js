function turnGPS(){
    var gpsSource = new ol.source.Vector()
    var gpsLayer = new ol.layer.Vector({source: gpsSource})
    map.addLayer(gpsLayer)
    navigator.geolocation.watchPosition(function(position){
        gpsSource.clear(true)
        map.removeLayer(gpsLayer)
        gps_position = position
        let coords = [position.coords.longitude, position.coords.latitude]
        let accuracy = ol.geom.Polygon.circular(coords, position.coords.accuracy)

        gpsSource.addFeatures([
            new ol.Feature(
                accuracy.transform('EPSG:4326', map.getView().getProjection())
            ),
            new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(coords)))
        ])
        map.addLayer(gpsLayer)
        
    }, function(error){
        console.log(`ERROR: ${error.message}`)
    },
    {
        enableHighAccuracy: true
    });
}





