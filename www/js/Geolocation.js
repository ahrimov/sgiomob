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
        enableHighAccuracy: true
    });
/*
    var geolocation = new ol.Geolocation({
        projection: map.getView().getProjection(),
        tracking: true,
        trackingOptions: {
        enableHighAccuracy: true,
        maximumAge: 1000  
        }
      });
      
      var iconStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: '#3399CC'
          }),
          stroke: new ol.style.Stroke({
            color: '#fff',
            width: 2
          })
        })
      });

      let lastPos;
      let currPos;
      console.log('bbbbbbbbbb')
      let position = new ol.geom.Point([0,0])
      console.log('aaaaa')
      var iconFeature = new ol.Feature({
        type: 'geoMarker',
        geometry: position,
    });   
    console.log('geometry done')
      var iconSource = new ol.source.Vector({
        features: [iconFeature]
      });    
      var iconLayer = new ol.layer.Vector({
        source: iconSource,
        style : iconStyle
      });    

    
      map.addLayer(iconLayer); 

      
      
      geolocation.on('change:position', function() {
        console.log('change pos')
        var pos = geolocation.getPosition();
        //startAnimation()
        iconFeature.setGeometry(new ol.geom.Point(pos)); 
        //map.getView().fit(iconFeature.getGeometry());
      });*/

/*

      const styles = {
        'route': new ol.style.Style({
          stroke: new ol.style.Stroke({
            width: 6,
            color: [237, 212, 0, 0.8],
          }),
        }),
        'icon': new ol.style.Style({
          image: new ol.style.Icon({
            anchor: [0.5, 1],
            src: 'data/icon.png',
          }),
        }),
        'geoMarker': new ol.style.Style({
          image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({color: 'black'}),
            stroke: new ol.style.Stroke({
              color: 'white',
              width: 2,
            }),
          }),
        }),
      };

        function startAnimation(){
            if(typeof startAnimation.counter == 'undefined'){
                startAnimation.counter = 0

                lastPos = geolocation.getPosition();
                currPos = lastPos
                console.log(currPos)
                position.setCoordinates(currPos);
            }

            currPos = geolocation.getPosition();

            let route = new ol.geom.LineString([lastPos, currPos])
            console.log('line created')
            let speed = geolocation.getSpeed()
            let distance = 0

            //let vector = ol.coordinate(currPos, -lastPos);
            //let distance = distanceBetweenPoints()

            let lastTime = Date.now();

            iconLayer.on('postrender', moveFeature);


            function moveFeature(event){
                const time = event.frameState.time;
                const elapsedTime = time - lastTime;
                distance = distance + (speed * elapsedTime);
                lastTime = time;
        
                const currentCoordinate = route.getCoordinateAt(
                    distance
                );
                console.log('curr coords', currentCoordinate)
                console.log('curr pos', currPos)
                if(isNaN(currentCoordinate[0])){
                    stopAnimation()
                    return
                }
                if(Math.abs(currentCoordinate[0] - currPos[0]) < geolocation.getAccuracy() &&
                Math.abs(currentCoordinate[1] - currPos[1]) < geolocation.getAccuracy()){
                    stopAnimation()
                    return
                }
                position.setCoordinates(currentCoordinate);
                const vectorContext = ol.render.getVectorContext(event);
                vectorContext.setStyle(styles.geoMarker);
                vectorContext.drawGeometry(position);
                // tell OpenLayers to continue the postrender animation
                map.render();
            }

            function stopAnimation(){
                console.log('stop')
                lastPos = currPos
                iconLayer.un('postrender', moveFeature);
            }
        }*/



      
}





