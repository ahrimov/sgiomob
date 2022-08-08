function showMap(){
    var scaleLine = new ol.control.ScaleLine({
        units: 'metric',
    })

    map = new ol.Map({
        target: 'map-container',
        layers: [raster],
        view: currentMapView,
        controls: [scaleLine, new CustomControls, new Crosshair, new UndoButton, new AcceptDrawButton]
    });
    for(layer of layers){
        map.addLayer(layer)
    }

    map.on('click', function(evt){
        setTimeout(showDialogFeatures, 50, evt)
    })

    updateInfo()
}

function findLayer(layerID){
    for(layer of layers){
        if(layer.id == layerID){
            return layer
        }
    }
    return null
}

function findFeatureByID(layer, id){
    let source = layer.getSource()
    let features = source.getFeatures()
    for(let feature of features){
        if(feature.id == id)
            return feature
    }
    return null
}

class LayerAtribs{
    constructor(name, label, type, options = null){
        this.name = name
        this.label = label
        this.type = type
        this.options = options
    }
}

function checkServiceField(label){
    if(label == 'lg_attach' || label == 'date_to1' || label == 'result_to1' ||
        label == 'date_to2' || label == 'result_to2' || label == 'date_tr' ||
        label == 'result_tr' || label == 'date_sr' || label == 'result_sr'){
        return true
    }
    return false
}

function getTypeByAtribName(atribs, atribName){
    for(atrib of atribs){
        if(atrib.name == atribName){
            return atrib.type
        }
    }
}

function getValueFromLayerAtrib(layerID, atribName, value){
    if(typeof value == 'undefined'){
        return " "
    }
    let layer = findLayer(layerID)
    for(atrib of layer.atribs){
        if(atrib.name == atribName){
            switch(getTypeByAtribName(layer.atribs, atribName)){
                case "BOOLEAN":
                    if(value === 1){
                        return "Да"
                    }
                    else{
                        return "Нет"
                    }
                case "DATE":
                    return new Date(value).toLocaleString()
                default:
                    return value
            }
        }
    }
    return value
}

function turnGPS(){
    var gpsSource = new ol.source.Vector()
    var gpsLayer = new ol.layer.Vector({source: gpsSource})
    map.addLayer(gpsLayer)
    navigator.geolocation.watchPosition(function(position){
        gpsSource.clear()
        gps_position = position
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
        
    });
}

 function updateInfo(){
    if(raster.isLocal){
        document.querySelector('#info-label').innerHTML = "Оффлайн"
        document.querySelector('.dot').setAttribute('style', 'background-color: #bbb;')
    }
    else{
        document.querySelector('#info-label').innerHTML = "Онлайн"
        document.querySelector('.dot').setAttribute('style', 'background-color: green;')
    }
 }

function addDrawInteraction(layer){
    map.activeLayer = layer
    if(typeof map.draw != 'undefined')
        map.removeInteraction(map.draw);
    map.draw = new ol.interaction.Draw({
        source: layer.getSource(),
        type: convertGeometryType(layer.geometryType),
        stopClick: true,
    });

    map.draw.on('drawstart', function(event){
        drawNextPoint(layer, event.feature)

        let undoButton = document.querySelector('.undo-button')
        undoButton.style['display'] = 'block'

        let acceptDrawButton = document.querySelector('.accept-draw-button-fab')
        acceptDrawButton.disabled = true

        /*let modify = ol.interaction.Modify({
            features: [event.feature]
        })
        map.modify = modify
        map.addInteraction(modify)*/
    })

    map.draw.on('drawend', function(event){
        let undoButton = document.querySelector('.undo-button')
        undoButton.style['display'] = 'none'

        let acceptDrawButton = document.querySelector('.accept-draw-button-fab')
        acceptDrawButton.disabled = false

        //map.removeInteraction(map.modify)
    })

    displayCancelButton()
   
    map.addInteraction(map.draw);
}

function drawNextPoint(layer, feature){
    if(typeof map.draw.currentFeature != 'undefined')
        layer.getSource().removeFeature(map.draw.currentFeature)
    map.draw.currentFeature = feature
}

function appendCoordinate(coordinate){
    if(map.activeLayer.geometryType == 'MULTIPOINT'){
        var point = new ol.geom.Point(coordinate)
        let feature = new ol.Feature({
            geometry: point
        })
        drawNextPoint(map.activeLayer, feature)
        let source = map.activeLayer.getSource()
        source.addFeature(feature)
    }
    else{
        map.draw.appendCoordinates([coordinate])
    }
}


function finishDraw(){
    if(typeof map.draw != 'undefined')
        map.removeInteraction(map.draw);

    removeCancelButton()

    let acceptDrawButton = document.querySelector('.accept-draw-button')
    acceptDrawButton.style['display'] = 'none'
    let drawButton = document.querySelector('.draw-button')
    drawButton.style['display'] = 'block'

    let drawInstrumentBar = document.querySelector('#draw-instrument-bar')
    drawInstrumentBar.style['display'] = 'none'
    let drawBar = document.querySelector('#draw-bar')
    drawBar.style['display'] = 'block'

    let undoButton = document.querySelector('.undo-button')
    undoButton.style['display'] = 'none'  
    
}

function displayCancelButton(){
    let cancelButton = document.querySelector('.cancel-button')
    cancelButton.style['display'] = 'block'
}

function removeCancelButton(){
    let cancelButton = document.querySelector('.cancel-button')
    cancelButton.style['display'] = 'none'
}

function convertGeometryType(type){
    switch(type){
        case 'MULTIPOINT':
            return 'MultiPoint'
        case 'MULTIPOLYGON':
            return 'MultiPolygon'
        case 'MULTILINESTRING':
            return 'MultiLineString'
        default:
            return 'Point'
    }
}




