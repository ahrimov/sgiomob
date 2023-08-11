function showMap(){
    var scaleLine = new ol.control.ScaleLine({
        units: 'metric',
    })

    map = new ol.Map({
        target: 'map-container',
        layers: [...baseRasterLayers],
        view: currentMapView,
        controls: [scaleLine, new CancelButton, new DrawButton, new GPSButton,
            new TileStatusBar, new ZoomMinusButton, new ZoomPlusButton, 
            new UndoButton, new AcceptDrawButton, new AcceptModifyButton, new NavigationButton,
            new CompassArrow, new HoldCenterButton],
        interaction: ol.interaction.defaults({altShiftDragRotate: false, pinchRotate: false})
    });
    for(layer of layers){
        map.addLayer(layer)
    }

    map.on('click', function(evt){
        if(typeof map.modify == 'undefined' || map.modify == null)
            setTimeout(showDialogFeatures, 50, evt)
    })

    map.on('moveend', (event) => {
        let extent = map.getView().calculateExtent(map.getSize());
        let is_overflow = false;
        let number_nodes = 0;
        layers.forEach((layer) =>{
            if(layer.visible){

                let source = layer.getSource();
                let features = source.getFeaturesInExtent(extent);
                let visible = layer.getVisible();
                for(let feature of features){
                    let coordinates = feature.getGeometry().getCoordinates();
                    coordinates = coordinates.toString();
                    coordinates = coordinates.split(',');
                    number_nodes += coordinates.length/3;

                    if(visible == true && is_overflow == false && number_nodes > numberNodesOnMap){
                        layer.setVisible(false);
                        is_overflow = true;
                        ons.notification.alert({
                            title:'Внимание',
                            messageHTML:`<p class="notification-alert">Не поддерживаемое количество объектов на слое ${layer.label}. Измените разрешение.</p>`});
                        break;
                    }
                }
                if(visible == true && is_overflow == true){
                    layer.setVisible(false);
                }
                else if(visible == false && number_nodes < numberNodesOnMap){
                    is_overflow = false;
                    layer.setVisible(true);
                }
                
            }
        })
    });
    
    let deniedCount = 0;

    function requestNavigation(){
        navigator.geolocation.getCurrentPosition(() => {
            hasGeolocationPermission = true;
            turnGPS();
        }, (error) => {
            deniedCount++;
            if(deniedCount < 5){
                setTimeout(requestNavigation, 1000);
            }
        });
    }
    
    updateInfo();
    requestNavigation();
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

function getAtribByName(atribs, atribName){
    for(atrib of atribs){
        if(atrib.name == atribName){
            return atrib
        }
    }
}

function getValueFromLayerAtrib(layerID, atribName, value){
    if(typeof value == 'undefined' || value === "undefined"){
        return " "
    }
    let layer = findLayer(layerID)
    for(let atrib of layer.atribs){
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
                case "ENUM":
                    const visible_value = atrib.options[value];
                    if(typeof visible_value === "undefined")
                        return "";
                    return atrib.options[value];
                default:
                    if(typeof value === "undefined")
                        return "";
                    return value
            }
        }
    }
    return value
}



 function updateInfo(){
    const visibleBaseLayer = baseRasterLayers.filter(layer => layer.get('visible'));
    let isOnline = false; 
    visibleBaseLayer.forEach(layer => {
        if(!layer.get('useLocalTiles')){
            isOnline = true;
        }
    });
    if(isOnline){
        document.querySelector('#info-label').innerHTML = "Онлайн";
        document.querySelector('.dot').setAttribute('style', 'background-color: green;');   
    }
    else{
        document.querySelector('#info-label').innerHTML = "Оффлайн";
        document.querySelector('.dot').setAttribute('style', 'background-color: #bbb;');
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
        acceptDrawButton.disabled = false
    })

    map.draw.on('drawend', function(event){
        let undoButton = document.querySelector('.undo-button')
        undoButton.style['display'] = 'none'
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
        
        let acceptDrawButton = document.querySelector('.accept-draw-button-fab')
        acceptDrawButton.disabled = false
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
    let drawBar = document.querySelector('#downbar-wrapper')
    drawBar.style['display'] = 'grid'

    let undoButton = document.querySelector('.undo-button')
    undoButton.style['display'] = 'none'  
    
}

function addModify(layer, feature){

    let old_geometry = feature.getGeometry().clone();

    var white = [255, 255, 255, 1];
    var width = 3;

    var style1 = new ol.style.Style({
        image: new ol.style.Circle({
          radius: width * 2,
          fill: new ol.style.Fill({
            color: "rgb(239, 0, 6)"
          }),
          stroke: new ol.style.Stroke({
            color: white,
            width: width / 2
          })
        }),
        zIndex: Infinity
      });
      
      var style2 = new ol.style.Style({
        image: new ol.style.Circle({
          radius: width * 2,
          fill: new ol.style.Fill({
            color: "rgb(159, 227, 0)"
          }),
          stroke: new ol.style.Stroke({
            color: white,
            width: width / 2
          })
        }),
        zIndex: Infinity
      });

    const modify = new ol.interaction.Modify({
        features: new ol.Collection([feature]),
        condition: ol.events.condition.always, /*function(olBrowserEvent){
            console.log(olBrowserEvent.type)
            console.log(olBrowserEvent.target.type)
            for(let key in olBrowserEvent.target){
                console.log(key)
            }
            return this.getPointerCount() !== 2;
        },*/
        pixelTolerance: 30,
        style: function (feature) {
            var point = feature.getGeometry().getCoordinates();
            var geometry = feature.get("features")[0].getGeometry();
            var type = geometry.getType();
            var coordinates =
              type === "Point"
                ? [geometry.getCoordinates()]
                : type === "LineString"
                ? geometry.getCoordinates()
                : type === "Polygon"
                ? geometry.getCoordinates()[0]
                : [];
            var match = false;
            coordinates.forEach(function (coordinate) {
              match =
                match || (coordinate[0] === point[0] && coordinate[1] === point[1]);
            });
            return match ? style1 : style2;
          }
    })

    map.modify = modify

    map.modify.modifyFeature = feature;
    map.modify.featureStyle = layer.getStyle().clone();
    map.modify.oldGeometry = old_geometry;

    let style = layer.getStyle().clone();
    switch(layer.geometryType){
        case 'MULTIPOINT':
            style = new ol.style.Style({
                image: new ol.style.Circle({
                    fill: new ol.style.Fill({color: selectedColor}),
                    stroke: new ol.style.Stroke({color: selectedColor}),
                    radius: 6
                })
            })
            break;
        case 'MULTIPOLYGON':
            style.getStroke().setWidth(3);
            style.getStroke().setColor(selectedColor);
            break;
        case 'MULTILINESTRING':
            style.getStroke().setWidth(3);
            style.getStroke().setColor(selectedColor);
            break;
    }
    feature.setStyle(style);
    createFeatureNodes(feature);

    map.modify.on('modifystart', function(event){
    })

    map.modify.on('modifyend', function(event){
        updateFeatureNodes(feature, map.modify.featureNodesLayer.getSource())
    })

    map.addInteraction(modify)

    let drawButton = document.querySelector('.draw-button')
    drawButton.style['display'] = 'none'

    let acceptModifyButton = document.querySelector('.accept-modify-button')
    acceptModifyButton.style['display'] = 'block'


    //clear page
    let drawBar = document.querySelector('#downbar-wrapper')
    drawBar.style['display'] = 'none'
    let mapContainer = document.querySelector('#map-container')
    mapContainer.style['height'] = "100%"
    document.querySelector('.crosshair').style['top'] = '50%';
    map.updateSize();

    disablePinchZoom();

    homeDisableButtons()
}

function enablePinchZoom(){
    let interactions = map.getInteractions().getArray();
    let pinchZoomInteraction = interactions.filter(function(interaction) {
        return interaction instanceof ol.interaction.PinchZoom;
    })[0];
    pinchZoomInteraction.setActive(true);
}

function disablePinchZoom(){
    let interactions = map.getInteractions().getArray();
    let pinchZoomInteraction = interactions.filter(function(interaction) {
        return interaction instanceof ol.interaction.PinchZoom;
    })[0];
    pinchZoomInteraction.setActive(false);
}

function createFeatureNodes(feature){
    let node_layer = new ol.layer.Vector();
    let style1 = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 3 * 2,
          fill: new ol.style.Fill({
            color: "rgb(239, 0, 6)"
          }),
          stroke: new ol.style.Stroke({
            color: "white",
            width: 3 / 2
          })
        }),
        zIndex: 10
      });
    node_layer.setStyle(style1);
    let node_source = new ol.source.Vector();
    node_layer.setSource(node_source);
    node_layer.setZIndex(Infinity);
    updateFeatureNodes(feature, node_source);
    map.addLayer(node_layer);
    map.modify.featureNodesLayer = node_layer;
}

function updateFeatureNodes(feature, node_source){
    node_source.clear(true);
    let coordinates = feature.getGeometry().getCoordinates();
    coordinates = coordinates.toString();
    coordinates = coordinates.replace(/,0/g, '')
    coordinates = coordinates.split(',');
    for(let i = 0; i < coordinates.length; i += 2){
        let node = new ol.Feature({geometry: new ol.geom.Point([coordinates[i], coordinates[i + 1]])});
        node_source.addFeature(node);
    }
}

function deleteFeatureNodes(){
    map.removeLayer(map.modify.featureNodesLayer);
}

function finishModify(){
    ons.notification.confirm({
        title: 'Модификация геометрии',
        message: 'Вы уверены, что хотите изменить геометрию элемента?',
        buttonLabels: ["Отмена", "Нет", "Да"]
    })
    .then(function(index) {
        if (index === 0) { 
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
    if(typeof map.modify == 'undefined' || map.modify == null) return;
    enablePinchZoom();
    map.modify.modifyFeature.setStyle(map.modify.featureStyle);
    deleteFeatureNodes();
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
        if(inp_string.search('Z') != -1 && inp_string.search('MULTI') != -1) return inp_string;

        if(inp_string.search('Z') != -1 && inp_string.search('MULTI') == -1){
            inp_string = inp_string.replace(/\(+/g, '((');
            inp_string = inp_string.replace(/\)+/g, '))');
            if(inp_string.search('MULTI') == -1)
                inp_string = insert(inp_string, 'MULTI');
            return inp_string; 
        }

        if(inp_string.search('MULTI') == -1)
            inp_string = insert(inp_string, 'MULTI');

        let string = inp_string
        if(inp_string.search('Z') == -1)
            string = insert(inp_string, ' Z', inp_string.search(/\(\(/));
        let res = string.matchAll(/,/g);
        let offset = 0;
        for(let r of res){
          string = insert(string, ' 0', r.index + offset);
          offset += 2;
        }
        return insert(string, ' 0', string.search(/\)\)/));
    }

    const format = new ol.format.WKT()
    let feautureString = format.writeFeature(feature)
    feautureString = convertToGeometryType(feautureString)
    
    let query = `UPDATE ${layer.id} SET Geometry = GeomFromText('${feautureString}', 3857) WHERE ${layer.atribs[0].name} = ${feature.id}`;
    requestToDB(query, function(res){
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

/**
 * Функцция поиска слоя карты по имени  
**/
function getLayerById(id = ''){
    const layers = map.getLayers().getArray();
    for(let layer of layers){
        if(layer.get('id') === id){
            return layer;
        }
    }
}

function getFeatureByName(name = '' , layer){
    if(!layer) return;
    const features = layer.getSource().getFeatures();
    for(let feature of features){
        if(feature.get('name') === name){
            return feature;
        }
    }
}

function isServiceFeature(feature){
    const name = feature.get('name');
    return (name === GEO_MARKER_NAME || name === GPS_ACCURACY_NAME);
}