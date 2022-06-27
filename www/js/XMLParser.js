function configParser(data){
    var parser = new DOMParser()
    var dom = parser.parseFromString(data, "application/xml")
    var pathToLayers = dom.getElementsByTagName("PathToLayers").item(0).textContent
    var layersName = dom.getElementsByTagName("LayersName").item(0).textContent.split("|")
    for(layerName of layersName){
        openFile(root_directory + pathToLayers + layerName, layerParser)
    }
}

function layerParser(data){
    var parser = new DOMParser()
    var dom = parser.parseFromString(data, "application/xml")
    var geometryStyle = dom.getElementsByTagName("geometryStyle").item(0)
    var geometryType = dom.getElementsByTagName("geometry").item(0).textContent
    var style;
    switch(geometryType){
        case "MULTIPOINT":
            style = pointStyleParse(geometryStyle)
            break;
        case "MULTIPOLYGON":
            style = polygonStyleParse(geometryStyle)
            break;
    }
    var layer = new ol.layer.Vector({
        style: style,
    }) 
    layer.id = dom.getElementsByTagName("id").item(0).textContent
    layer.label = dom.getElementsByTagName("label").item(0).textContent
    layer.atribs = []
    layer.atribs_label = []
    layer.atribs_type = []
    var atribs = dom.getElementsByTagName("attribute")
    for(atrib of atribs){
        if(atrib.getElementsByTagName("required").item(0).textContent === '1'){
            layer.atribs.push(atrib.getElementsByTagName('id').item(0).textContent)
            layer.atribs_label.push(atrib.getElementsByTagName('label').item(0).textContent)
            layer.atribs_type.push(atrib.getAttribute('type'))
        }
    }
    layers.push(layer)
    getDataLayerFromBD(layer)
    map.addLayer(layer)
    layer.visible = true
}


function pointStyleParse(dom){
    var fill = new ol.style.Fill({color: dom.getElementsByTagName("Fill").item(0).getElementsByTagName("CssParameter").item(0).textContent})
    var xmlStroke = dom.getElementsByTagName("Stroke").item(0)
    var stroke = new ol.style.Stroke({color:xmlStroke.getElementsByTagName("CssParameter").item(0).textContent, width:parseInt(xmlStroke.getElementsByTagName("CssParameter").item(1).textContent)})
    var size = parseInt(dom.getElementsByTagName("Size").item(0).textContent)
    var rotation = parseInt(dom.getElementsByTagName("Rotation").item(0).textContent)
    switch(dom.getElementsByTagName("WellKnownName").item(0).textContent){
        case "square":
            return new ol.style.Style({
                image: new ol.style.RegularShape({
                    fill: fill,
                    stroke: stroke,
                    points: 4,
                    radius: size,
                    rotation: rotation,
                    angle: Math.PI / 4,
                })
            })
        case "triangle":
            return new ol.style.Style({
                image: new ol.style.RegularShape({
                    fill: fill,
                    stroke: stroke,
                    points: 3,
                    radius: size,
                    rotation: rotation,
                    angle: 0,
                })
            })
    }
}

function polygonStyleParse(dom){
    return new ol.style.Style({
        fill: new ol.style.Fill({
            color: dom.getElementsByTagName("CssParameter").item(0).textContent
        }),
        stroke: new ol.style.Stroke({
            color: dom.getElementsByTagName("CssParameter").item(1).textContent,
            width: parseInt(dom.getElementsByTagName("CssParameter").item(2).textContent)
        })
    })
}

