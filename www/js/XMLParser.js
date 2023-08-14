function configParser(data, title){
    var parser = new DOMParser()
    var dom = parser.parseFromString(data, "application/xml")
    var pathToLayers = dom.getElementsByTagName("PathToLayers").item(0).textContent
    var layersName = dom.getElementsByTagName("LayersName").item(0).textContent.split("|")
    
    updateVectorLayers(pathToLayers, function(){
        for(let layerName of layersName){
            openFile(root_directory + pathToLayers + layerName, layerParser)
        }
    });

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
    });

    const pathToBaseRasterLayers = dom.getElementsByTagName("PathToBaseRasterLayers")?.item(0)?.textContent;
    if(typeof pathToBaseRasterLayers !== "undefined"){
        openFileFromProject(pathToBaseRasterLayers, function(text){
            try{
                const jsonArray = JSON.parse(text);
                baseRasterLayers = parseBaseRasterLayers(jsonArray);
            } catch(e){
                ons.notification.alert({
                    title:"Внимание", 
                    messageHTML:`<p class="notification-alert">Некорректный json-файл: ${pathToBaseRasterLayers} </p>`
                });
            }
        }, true);
    }

    pathToImageStorage = dom.getElementsByTagName("PathToImageStorage").item(0).textContent
    pathToKMLStorage = dom.getElementsByTagName("PathToKMLStorage").item(0).textContent
    if(typeof dom.getElementsByTagName("NumberNodesOnMap").item(0).textContent != "undefined"){
        numberNodesOnMap = dom.getElementsByTagName("NumberNodesOnMap").item(0).textContent;
    } 

    function layerParser(data,title){
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
                try{
                    style = pointStyleParse(geometryStyle);
                } catch(e) {
                    style = new ol.style.Style({
                        image: new ol.style.Circle({
                            fill: new ol.style.Fill({color: generateColor()}),
                            radius: 3
                        })
                    })
                }
                break;
            case "MULTIPOLYGON":
                try{
                    style = polygonStyleParse(geometryStyle);
                }
                catch(e){
                    style = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: generateColor()
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'rgb(0,0,0)',
                            width: 1
                        })
                    })
                }
                break;
            case "MULTILINESTRING":
                try{
                    style = lineStyleParse(geometryStyle);
                } catch(e){
                    style = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: generateColor(),
                            width: 2
                        })
                    })
                }
                break;
            default:
                style = new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({color: generateColor()}),
                        radius: 3
                    })
                })
        }
        const layer = new ol.layer.Vector({
            style: style,
            renderMode: 'image'
        }); 
        layer.set("id", dom.getElementsByTagName("id").item(0).textContent);
        layer.set("descr", dom.getElementsByTagName("label").item(0).textContent);
        layer.id = dom.getElementsByTagName("id").item(0).textContent;
        layer.label = dom.getElementsByTagName("label").item(0).textContent
        layer.geometryType = geometryType
        layer.atribs = []
        var atribs = dom.getElementsByTagName("attribute")
        for(atrib of atribs){
                let atribName = atrib.getElementsByTagName('id').item(0).textContent
                let label = atrib.getElementsByTagName('label').item(0).textContent
                let type = atrib.getAttribute('type')
                if(type == 'ENUM'){
                    let options = parseEnum(atrib.getElementsByTagName('options').item(0).textContent)
                    layer.atribs.push(new LayerAtribs(atribName, label, type, options))
                }
                else
                    layer.atribs.push(new LayerAtribs(atribName, label, type))
        }

        let enabled = true;
        if(typeof dom.getElementsByTagName("layerDb").item(0) != "undefined"){
            let enabled_string = dom.getElementsByTagName("layerDb").item(0).getAttribute('enabled');
            if(enabled_string === "false"){
                enabled = false;
            }
        }
        layer.enabled = enabled;
        
        layerParser.counter++;

        for(let i in layersName){
            if(layersName[i] === title){
                layer.setZIndex(layersName.length - i);
            }
        }

        layers.push(layer);
        getDataLayerFromBD(layer);
        map.addLayer(layer);
        layer.visible = true;
    }
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

function parseEnum(options_string){
    let options_array = options_string.split('|');
    let options = {}
    for(let option_string of options_array){
  	    if(option_string === "") continue;
	    let key, value;
  	    if(option_string.search(/[^#]#[^#]/) != -1){
    	    let found = option_string.split('#');
      	    key = found[0];
      	    value = found[1];
        }
	    else{
    	    key = option_string;
      	    value = option_string;
        }
  	    options[key] = value;
    }
    return options;
}

function updateVectorLayers(pathToLayers, callback){
    let targetDirName = root_directory + pathToLayers;
    window.resolveLocalFileSystemURL(cordova.file.applicationDirectory,
        function(resourcesDir){
            resourcesDir.getDirectory('www/resources/Project/VectorLayers', {create: false}, getDirectoryWin, getDirectoryFail)
        }
    );

    function getDirectoryWin(directory){
        window.resolveLocalFileSystemURL(targetDirName,
            function(targetDir) {
                targetDir.removeRecursively(() => {
                    window.resolveLocalFileSystemURL(root_directory, function(root){
                        directory.copyTo(root, pathToLayers, copyWin, copyFail);
                    }, () => {
                        copyFail();
                    })
                }, () => { copyFail(); });
        }, function(){
            console.log('get vector fail')
            window.resolveLocalFileSystemURL(root_directory, function(root){
                directory.copyTo(root, pathToLayers, copyWin, copyFail);
            }, () => {
                ons.notification.alert({title:"Внимание", message:`Ошибка при обновлении файлов описания слоёв.
                Будут использоваться старые файлы описания.`});
                copyFail();
            })
        });
    }

    function getDirectoryFail(){
        ons.notification.alert({title:"Внимание", message:`Ошибка при обновлении файлов описания слоёв.
         Будут использоваться старые файлы описания.`});
         callback();
    }

    function copyWin(){
        callback();
    }

    function copyFail(){
        console.log('copy fail')    
         callback();
    }
}

function parseBaseRasterLayers(jsonArray){
    return jsonArray.map((json) => {
        let source;
        if(json.projection === 'EPSG:3395'){
            source = new ol.source.XYZ({
                projection: json.projection,
                url: json.useLocalTiles ? main_directory + json.local_path : json.remote_url,
                tileGrid: ol.tilegrid.createXYZ({
                    extent: [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244]
                }),
                tileSize: json.tileSize
            });
        }
        else{
            source = new ol.source.XYZ({
                projection: json.projection,
                url: json.useLocalTiles ? main_directory + json.local_path : json.remote_url,
                tileSize: json.tileSize
            });
        }
        if(json.useLocalTiles){
            source.setTileLoadFunction(tileLoadFunctionLocal);
        }
        if(json.id === 'Rosreestr'){
            rosreestr_url = json.remote_url;
            source.setTileUrlFunction(rosreetrUrlFunction);
        }
        return new ol.layer.Tile({
            id: json.id,
            descr: json.descr,
            visible: json.visible,
            zIndex: parseInt(json.order),
            icon: json.icon,
            maxZoom: 24,
            useLocalTiles: json.useLocalTiles,
            local_path: json.local_path,
            remote_url: json.remote_url,
            source: source
        });
    });
}