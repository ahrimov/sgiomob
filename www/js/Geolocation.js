// function turnGPS(){
//     // const geolocation = new ol.Geolocation({
//     //     projection: map.getView().getProjection(),
//     //     trackingOptions: {
//     //         maximumAge: 10000,
//     //         enableHighAccuracy: true,
//     //         timeout: 600000,
//     //     },
//     // });

//     // const gpsSource = new ol.source.Vector();
//     // const gpsLayer = new ol.layer.Vector({source: gpsSource});


//     // geolocation.on('change', function(){
//     //     const position = geolocation.getPosition();
//     //     const accuracy = geolocation.getAccuracy();
//     //     const heading = geolocation.getHeading() || 0;
//     //     const speed = geolocation.getSpeed() || 0;
//     //     gpsSource.clear(true);
//     //     map.removeLayer(gpsLayer);
//     //     console.log(position);
//     //     gpsSource.addFeature(
//     //          new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(position)))
//     //      )
//     //      map.addLayer(gpsLayer)

//     // });

//     // geolocation.on('error', function(){
//     //     console.log('geolocation error');
//     // });

// //     const positions = new ol.geom.LineString([], 'XYZM');
// //     let deltaMean = 500; // the geolocation sampling period mean in ms

// //     var gpsSource = new ol.source.Vector();
// //     var gpsLayer = new ol.layer.Vector({source: gpsSource});
// //     map.addLayer(gpsLayer);
// //     let accuracy;

// //     navigator.geolocation.watchPosition(function(position){
// //         gps_position = position;
// //         let coord = [position.coords.longitude, position.coords.latitude];
// //         accuracy = ol.geom.Polygon.circular(coord, position.coords.accuracy)
// //         const heading = position.coords.heading || 0;
// //         const speed = position.coords.speed || 0;

// //         const m = Date.now();

// //         addPosition(coord, heading, m, speed);

// //         const coords = positions.getCoordinates();
// //         const len = coords.length;
// //         if (len >= 2) {
// //             deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
// //         }

// //         updateView();


// //         // gpsSource.clear(true)
// //         // map.removeLayer(gpsLayer)
// //         // gps_position = position
// //         // let coords = [position.coords.longitude, position.coords.latitude]
// //         // accuracy = ol.geom.Polygon.circular(coords, position.coords.accuracy)

// //         // gpsSource.addFeatures([
// //         //     new ol.Feature(
// //         //         accuracy.transform('EPSG:4326', map.getView().getProjection())
// //         //     ),
// //         //     new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(coords)))
// //         // ])
// //         // map.addLayer(gpsLayer)
        
// //     }, function(error){
// //         console.log(`ERROR: ${error.message}`)
// //     },{
// //         maximumAge: 10000,
// //         enableHighAccuracy: true,
// //         timeout: 600000,
// //     });

// //     function addPosition(coords, heading, m, speed) {
// //         const x = coords[0];
// //         const y = coords[1];
// //         const fCoords = positions.getCoordinates();
// //         const previous = fCoords[fCoords.length - 1];
// //         const prevHeading = previous && previous[2];
// //         if (prevHeading) {
// //             let headingDiff = heading - mod(prevHeading);

// //             // force the rotation change to be less than 180°
// //             if (Math.abs(headingDiff) > Math.PI) {
// //                 const sign = headingDiff >= 0 ? 1 : -1;
// //                 headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
// //             }
// //             heading = prevHeading + headingDiff;
// //         }
// //         positions.appendCoordinate([x, y, heading, m]);

// //         // only keep the 20 last coordinates
// //         positions.setCoordinates(positions.getCoordinates().slice(-20));

// //         // FIXME use speed instead
// //         // if (heading && speed) {
// //         //     markerEl.src = 'data/geolocation_marker_heading.png';
// //         // } else {
// //         //     markerEl.src = 'data/geolocation_marker.png';
// //         // }
// //     }

// //     let previousM = 0;
// //     function updateView() {
// //         // use sampling period to get a smooth transition
// //         let m = Date.now() - deltaMean * 1.5;
// //         m = Math.max(m, previousM);
// //         previousM = m;
// //         // interpolate position along positions LineString
// //         const c = positions.getCoordinateAtM(m, true);
// //         const view = map.getView();
// //         if (c) {
// //             // view.setCenter(getCenterWithHeading(c, -c[2], view.getResolution()));
// //             // view.setRotation(-c[2]);
// //             gpsSource.clear(true);
// //             gpsSource.addFeatures([
// //                 new ol.Feature(
// //                     accuracy.transform('EPSG:4326', map.getView().getProjection())
// //                 ),
// //                 new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(c)))
// //             ]);
// //             map.render();
// //         }
// //     }

// //     // modulo for negative values
// //     function mod(n) {
// //         return ((n % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
// //     }

// //     // recenters the view by putting the given coordinates at 3/4 from the top or
// // // the screen
// //     function getCenterWithHeading(position, rotation, resolution) {
// //         const size = map.getSize();
// //         const height = size[1];

// //         return [
// //             position[0] - (Math.sin(rotation) * height * resolution * 1) / 4,
// //             position[1] + (Math.cos(rotation) * height * resolution * 1) / 4,
// //         ];
// //     }
// }

function turnGPS_old(){
    const currentPosition = new ol.geom.Point(map.getView().getCenter());

    const geoMarker = new ol.Feature({
        geometry: currentPosition,
        style: new ol.style.Style({
            image: new ol.style.Circle({
              radius: 7,
              fill: new ol.style.Fill({color: 'black'}),
              stroke: new ol.style.Stroke({
                color: 'white',
                width: 2,
              }),
            }),
      }),
    });

    const gpsSource = new ol.source.Vector();
    const gpsLayer = new ol.layer.Vector({source: gpsSource});
    gpsSource.addFeature(geoMarker);

    map.addLayer(gpsLayer);
    const positions = new ol.geom.LineString([]);
    const influenceOfAccuracy = 0.01;
    let speed = 0;
    let distance = 0;

    let lastTime;

    let postrenderListener = null;

    navigator.geolocation.watchPosition(function(position){
        
        let coords = [position.coords.longitude, position.coords.latitude];
        let accuracy = ol.geom.Polygon.circular(coords, position.coords.accuracy);

        const coordinates = positions.getCoordinates();
        const len = coordinates.length;
        if(len > 1){

            const prevCoord = coordinates[len - 1];
            const distance = measure(coords[0], coords[1], prevCoord[0], prevCoord[1]);
            // const vector = [coords[0] - prevCoord[0], coords[1] - prevCoord[1]];
            // const length = Math.sqrt(vector[0]**2 + vector[1]**2);
            if(distance < position.coords.accuracy * influenceOfAccuracy){
                return;
            } 
        }

        positions.appendCoordinate(coords);
        positions.setCoordinates(positions.getCoordinates().slice(-20));

        spped = position.coords.speed;

        gps_position = position;

        lastTime = Date.now();

        postrenderListener = gpsLayer.on('postrender', moveFeature);

        geoMarker.setGeometry(null);

        // gpsSource.clear(true);
        // gpsSource.addFeatures([
        //     new ol.Feature(
        //         accuracy.transform('EPSG:4326', map.getView().getProjection())
        //     ),
        //     new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(coords)))
        // ]);
        
    }, function(error){
        console.log(`ERROR: ${error.message}`);
    },
    {
        maximumAge: 10000,
        enableHighAccuracy: true,
        timeout: 600000,
    });


    function measure(lat1, lon1, lat2, lon2){  // generally used geo measurement function
        var R = 6378.137; // Radius of earth in KM
        var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
        var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        return d * 1000; // meters
    }

    function moveFeature(event){
        const time = event.frameState.time;
        const elapsedTime = time - lastTime;
        distance = (distance + (speed * elapsedTime) / 1e6) % 2;
        lastTime = time;

        const currentCoordinate = positions.getCoordinateAt(
            distance > 1 ? 1 : distance
        );

        if(distance === 1){
            ol.Observable.unByKey(postrenderListener);
        }

        currentPosition.setCoordinates(currentCoordinate);
        const vectorContext = getVectorContext(event);
        vectorContext.setStyle(styles.geoMarker);
        vectorContext.drawGeometry(position);
        // tell OpenLayers to continue the postrender animation
         map.render();
    }

    const styles = {
      'route': new ol.style.Style({
        stroke: new ol.style.Stroke({
          width: 6,
          color: [237, 212, 0, 0.8],
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
}


const gpsMarkerStyle = [
        new ol.style.Style({
        image: new ol.style.RegularShape({
            fill: new ol.style.Fill({color: 'rgba(35, 117, 250, 0.65)'}),
            points: 3,
            angle: 0,
            displacement: [0, 8],
            radius: 11,
            radius2: 6
        })
    }),
    new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({color: '#2375fa'}),
          stroke: new ol.style.Stroke({
            color: 'white',
            width: 3,
          }),
        }),
    })
];



function turnGPS(){
    const influenceOfAccuracy = 0.01;
    let listener = null;
    const center = map.getView().getCenter();

    const currentPosition = new ol.geom.Point(center);

    const geoMarker = new ol.Feature({
        geometry: currentPosition,
    });

    geoMarker.setStyle(gpsMarkerStyle);

    const gpsSource = new ol.source.Vector();
    const gpsLayer = new ol.layer.Vector({source: gpsSource});
    gpsSource.addFeature(geoMarker);

    map.addLayer(gpsLayer); 

    //const linestringCoords = [center, [center[0] + 100000, center[1] + 100000]];

    const positions = new ol.geom.LineString([]);

    const lineFeature = new ol.Feature({
        geometry: positions,
    });
    
    gpsSource.addFeature(lineFeature);

    navigator.geolocation.watchPosition(function(geoposition){
        if(listener){
            geoMarker.setGeometry(null);
        }

        const coords = [geoposition.coords.longitude, geoposition.coords.latitude];

        const coordinates = positions.getCoordinates();
        const len = coordinates.length;
        if(len > 1){
            const prevCoord = coordinates[len - 1];
            const distance = measure(coords[0], coords[1], prevCoord[0], prevCoord[1]);
            if(distance < geoposition.coords.accuracy * influenceOfAccuracy || listener){
                return;
            } 
        }

        positions.appendCoordinate(coords);
        positions.setCoordinates(positions.getCoordinates().slice(-2));

        gps_position = geoposition;

        let lastTime;
        let distance = 0;
        // start animation

        lastTime = Date.now();

        function moveFeature(event){
            console.log('move feature')
            const speed = 700;
            const time = event.frameState.time;
            const elapsedTime = time - lastTime;
            distance = (distance + (speed * elapsedTime) / 1e6) % 2;
            lastTime = time;

            const currentCoordinate = positions.getCoordinateAt(
                distance > 1 ? 1 : distance
            );

            if(distance >= 1){
                distance = 0;
                ol.Observable.unByKey(listener);
                geoMarker.setGeometry(currentPosition);
                listener = null;
                return;
            }

            currentPosition.setCoordinates(ol.proj.fromLonLat(currentCoordinate, map.getView().getProjection()));
            const vectorContext = ol.render.getVectorContext(event);
            vectorContext.setStyle(gpsMarkerStyle);
            vectorContext.drawGeometry(currentPosition);
            // tell OpenLayers to continue the postrender animation
            map.render();
        }

        listener = gpsLayer.on('postrender', moveFeature);

        if(distance >= 1){
            distance = 0;
            ol.Observable.unByKey(listener);
            geoMarker.setGeometry(currentPosition);
            return;
        }

    }, function(error){
        console.log(`ERROR: ${error.message}`);
    }, {
        maximumAge: 50,
        enableHighAccuracy: true,
        timeout: 600000,
    });
}

function measure(lat1, lon1, lat2, lon2){  // generally used geo measurement function
    var R = 6378.137; // Radius of earth in KM
    var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000; // meters
}