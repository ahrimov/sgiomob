function turnGPS(){
    var gpsSource = new ol.source.Vector()
    var gpsLayer = new ol.layer.Vector({source: gpsSource})
    map.addLayer(gpsLayer)
    navigator.geolocation.watchPosition(function(position){
        console.log('papare')
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
/*
        var point = new ol.geom.Point(ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]))
        var marker = new ol.Feature(point)
        marker.setStyle(new ol.style.Style({
            image: new  ol.style.Circle({
                radius: 7,
                fill: new  ol.style.Fill({
                    color: '#fcfafa',
                }),
                stroke: new ol.style.Stroke({
                    color: '#1870f5',
                    width: 2
                })
            })
        }))

        var circle = new ol.geom.Circle(ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]), position.coords.accuracy);
        var circle_feature = new ol.Feature(circle)
        circle_feature.setStyle(new ol.style.Style({
            
                fill: new ol.style.Fill({
                    color: [135, 207, 255, 0.5]
                }),
                stroke: new ol.style.Stroke({
                    color: '#2765f5',
                    with: 1
                })
        
        }))
        gpsSource.addFeature(circle_feature)
        gpsSource.addFeature(marker)
        map.addLayer(gpsLayer)*/
        
    }, function(error){
        console.log(`ERROR: ${error.message}`)
    },
    {
        enableHighAccuracy: true,
    });
}