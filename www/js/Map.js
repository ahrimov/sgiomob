function showMap(){
    var scaleLine = new ol.control.ScaleLine({
        units: 'metric',
    })

    map = new ol.Map({
        target: 'map-container',
        layers: [raster],
        view: currentMapView,
        controls: [scaleLine, new CustomControls, new Crosshair, new UndoButton, new AcceptDrawButton, new AcceptModifyButton]
    });
    for(layer of layers){
        map.addLayer(layer)
    }

    map.on('click', function(evt){
        if(typeof map.modify == 'undefined' || map.modify == null)
            setTimeout(showDialogFeatures, 50, evt)
    })

    updateInfo()
    turnGPS()
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

        /*const modify = new ol.interaction.Modify({
            source: layer.getSource()
        })

        map.modify = modify

        map.addInteraction(modify);*/
    })

    map.draw.on('drawend', function(event){
        let undoButton = document.querySelector('.undo-button')
        undoButton.style['display'] = 'none'

        let acceptDrawButton = document.querySelector('.accept-draw-button-fab')
        acceptDrawButton.disabled = false

        /*map.removeInteraction(map.modify)
        map.modify = null*/
    })

    displayCancelButton()
    homeDisableButtons()
   
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
    homeEnableButton()

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

function addModify(layer, feature){

    let old_geometry = feature.getGeometry().clone();

    const modify = new ol.interaction.Modify({
        source: layer.getSource(),
        stopClick: true,
        condition: function(evt){
            let features = map.getFeaturesAtPixel(evt.pixel)
            for(let feat of features){
                if(feat.id == feature.id)
                    return true;
            }
            return false;
        },
    })

    map.modify = modify

    map.modify.modifyFeature = feature;
    map.modify.oldGeometry = old_geometry;

    console.log(old_geometry.getClosestPoint([0,0]))

    map.addInteraction(modify)

    let drawButton = document.querySelector('.draw-button')
    drawButton.style['display'] = 'none'

    let acceptModifyButton = document.querySelector('.accept-modify-button')
    acceptModifyButton.style['display'] = 'block'


    //clear page
    let drawBar = document.querySelector('#draw-bar')
    drawBar.style['display'] = 'none'
    let mapContainer = document.querySelector('#map-container')
    mapContainer.style['height'] = "100%"
    map.updateSize();

    homeDisableButtons()
    


    /*console.log('geometry', feature.geometry)
    let modify = ol.interaction.Modify({
        features: [feature]
    })
    map.modify = modify
    map.addInteraction(modify)*/
}

function finishModify(){
    ons.notification.confirm({
        title: 'Модификация геометрии',
        message: 'Вы уверены, что хотите изменить геометрию элемента?',
        buttonLabels: ["Отмена", "Нет", "Да"]
    })
    .then(function(index) {
        if (index === 0) { 
            console.log(map.modify.oldGeometry.getClosestPoint([0,0]))
            map.modify.modifyFeature.setGeometry(map.modify.oldGeometry);
            removeModify();
        }
        if(index === 2){
            updateFeatureGeometry(map.modify.modifyFeature);
            removeModify();
        }
    });
}

function removeModify(){
    map.removeInteraction(map.modify);
    map.modify = null

    homeEnableButton()

    let acceptModifyButton = document.querySelector('.accept-modify-button')
    acceptModifyButton.style['display'] = 'none'

    let drawButton = document.querySelector('.draw-button')
    drawButton.style['display'] = 'block'
}

function updateFeatureGeometry(feature){
    let layer = findLayer(feature.layerID);

    function convertToGeometryType(inp_string){
        if(inp_string.search('Z') != -1) return inp_string;
        let string = insert(inp_string, ' Z', inp_string.search(/\(\(/))
        let res = string.matchAll(/,/g)
        let offset = 0
        for(let r of res){
          string = insert(string, ' 0', r.index + offset)
          offset += 2
        }
        return insert(string, ' 0', string.search(/\)\)/))
    }

    const format = new ol.format.WKT()
    let feautureString = format.writeFeature(feature)
    feautureString = convertToGeometryType(feautureString)
    
    let query = `UPDATE ${layer.id} SET Geometry = GeomFromText('${feautureString}', 3857) WHERE ${layer.atribs[0].name} = ${feature.id}`
    console.log(query)
    requestToDB(query, function(res){
        //ons.notofication.alert
        saveDB();
    })
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





