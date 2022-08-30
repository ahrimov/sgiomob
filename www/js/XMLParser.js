function configParser(data){
    var parser = new DOMParser()
    var dom = parser.parseFromString(data, "application/xml")
    var pathToLayers = dom.getElementsByTagName("PathToLayers").item(0).textContent
    var layersName = dom.getElementsByTagName("LayersName").item(0).textContent.split("|")
    for(layerName of layersName){
        openFile(root_directory + pathToLayers + layerName, layerParser)
    }
    var nameDB = dom.getElementsByTagName("NameDB").item(0).textContent
    var filenameDB = dom.getElementsByTagName("FilenameDB").item(0).textContent
    var pathToDB = dom.getElementsByTagName("PathToDB").item(0).textContent
    initialDB(root_directory + pathToDB, filenameDB, nameDB)
    const centerLong = parseFloat(dom.getElementsByTagName("longitude").item(0).textContent)
    const centerLat = parseFloat(dom.getElementsByTagName("latitude").item(0).textContent)
    const minZoom = parseInt(dom.getElementsByTagName("MinZoom").item(0).textContent)
    const maxZoom = parseInt(dom.getElementsByTagName("MaxZoom").item(0).textContent)
    const zoom = parseInt(dom.getElementsByTagName("zoom").item(0).textContent)
    currentMapView = new ol.View({
        center: ol.proj.fromLonLat([centerLong, centerLat]),
        zoom: zoom,
        minZoom: minZoom,
        maxZoom: maxZoom,
        projectin: `EPSG:4326`
    })
    if(dom.getElementsByTagName("IsLocalTiles").item(0).textContent === '1'){
        raster.isLocal = true
        const pathToTiles = dom.getElementsByTagName("PathToTiles").item(0).textContent
        switch(dom.getElementsByTagName("TileLoaderOption").item(0).textContent){
            case "Invert":
                localSource = new ol.source.OSM({
                    url: root_directory + pathToTiles + '{z}/{x}/{-y}.png',
                    tileLoadFunction: function(imageTile, src){
                    window.resolveLocalFileSystemURL(src, function success(fileEntry){
                        imageTile.getImage().src = fileEntry.toInternalURL();
                      }, function(error){
                        window.resolveLocalFileSystemURL(root_directory + pathToTiles + 'empty_tile.png', function(fileEntry){
                            imageTile.getImage().src = fileEntry.toInternalURL();
                        }, function(error){
                            console.log('Not find a tile')
                        })
                      })
                    }
                })
                raster.setSource(localSource)
                break;
            default:
                localSource = new ol.source.OSM({
                    url: root_directory + pathToTiles + '{z}/{x}/{y}.png',
                    tileLoadFunction: function(imageTile, src){
                    window.resolveLocalFileSystemURL(src, function success(fileEntry){
                        imageTile.getImage().src = fileEntry.toInternalURL();
                      }, function(error){
                        window.resolveLocalFileSystemURL(root_directory + pathToTiles + 'empty_tile.png', function(fileEntry){
                            imageTile.getImage().src = fileEntry.toInternalURL();
                        }, function(error){
                            console.log('Not find a tile')
                        })
                      })
                    }
                })
                raster.setSource(localSource)
        }
        updateInfo()
    }

    pathToImageStorage = dom.getElementsByTagName("PathToImageStorage").item(0).textContent
    pathToKMLStorage = dom.getElementsByTagName("PathToKMLStorage").item(0).textContent
}

function layerParser(data){
    if(typeof layerParser.counter == 'undefined'){
        layerParser.counter = 0
    }

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
        case "MULTILINESTRING":
            style = lineStyleParse(geometryStyle)
            break;
        default:
            style = new ol.style.Style({
                image: new ol.style.Circle({
                    fill: new ol.style.Fill({color: "#305cc9"}),
                    radius: 3
                })
            })
    }
    var layer = new ol.layer.Vector({
        style: style,
        renderMode: 'image'
    }) 
    layer.id = dom.getElementsByTagName("id").item(0).textContent
    layer.label = dom.getElementsByTagName("label").item(0).textContent
    layer.geometryType = geometryType
    layer.atribs = []
    var atribs = dom.getElementsByTagName("attribute")
    for(atrib of atribs){
            let atribName = atrib.getElementsByTagName('id').item(0).textContent
            let label = atrib.getElementsByTagName('label').item(0).textContent
            let type = atrib.getAttribute('type')
            if(type == 'ENUM'){
                let options = atrib.getElementsByTagName('options').item(0).textContent.split('|')
                layer.atribs.push(new LayerAtribs(atribName, label, type, options))
            }
            else
                layer.atribs.push(new LayerAtribs(atribName, label, type))
    }

    
    layerParser.counter++
    layer.setZIndex(layerParser.counter)

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
        default:
            return new ol.style.Style({
                image: new ol.style.Circle({
                    fill: fill,
                    stroke: stroke,
                    radius: size,
                    rotation: rotation,
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

function lineStyleParse(dom){
    return new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: dom.getElementsByTagName("CssParameter").item(0).textContent,
            width: parseInt(dom.getElementsByTagName("CssParameter").item(1).textContent)
        })
    })
}

