function exportKML(layerID){
    let layer = findLayer(layerID)
    let format = new ol.format.KML({
        showPointNames: true,
        writeStyles: true,
        
    })
    let features = layer.getSource().getFeatures()
    let clone_features = []
    const query = `SELECT * FROM ${layer.id}`
    requestToDB(query, function(data){
        for(let i = 0; i < data.rows.length; i++){
            let prop = {}
            for(let atrib of layer.atribs){
                prop[atrib.name] = data.rows.item(i)[atrib.name]
            }
            for(let feature of features){
                if(feature.id == data.rows.item(i)[layer.atribs[0].name]){
                    let clone_feature = feature.clone()
                    clone_feature.setProperties(prop)
                    let geom = clone_feature.getGeometry()
                    geom.transform('EPSG:3857', 'EPSG:4326')
                    clone_features.push(clone_feature)
                    break
                }
            }
        }

        let kml = format.writeFeatures(clone_features, {
            dataProjection: 'EPSG:4236',
            featureProjection: 'EPSG:3857'
        })

        let date = new Date()

        function formatDate(date){
            return `_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}_
                ${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`
        }

        saveFile(root_directory + pathToKMLStorage, layer.id + formatDate(date) + '.kml', kml)
    })
}

function importKML(layerID, properties, features){
    let layer = findLayer(layerID)
    for(let feature of features){

        if(compareGeometryTypes(layer.geometryType, feature.getGeometry().getType()) == 0){
            convertFeatureToLayerGeometry(feature, layer)
        }

        let props = filterProperties(feature.getProperties(), properties, layer)
        let feature_id = props[properties[layer.atribs[0].name]]
        let query = `SELECT COUNT(1) as bool FROM ${layer.id} WHERE ${layer.atribs[0].name} = ${feature_id};`
        requestToDB(query, function(data){
            if(data.rows.item(0).bool == 1){
                let updates = []
                for(let key in properties){
                    if(typeof properties[key] == 'undefined' ||
                     properties[key] == '' || typeof props[properties[key]] == 'undefined' ||
                     key == 'ID')
                        continue
                    updates.push(`${key} = '${props[properties[key]]}'`)
                }

                let geom = feature.getGeometry()
                geom.transform('EPSG:4326', 'EPSG:3857')

                const format = new ol.format.WKT()
                let feautureString = format.writeFeature(feature)
                feautureString = convertToGeometryType(feautureString)
                updates.push(`Geometry = GeomFromText('${feautureString}', 3857)`)
                query = `UPDATE ${layer.id } SET ${updates.join(', ')} WHERE ${layer.atribs[0].name} = ${feature_id} `
                console.log(query)
                requestToDB(query, function(res){
                    for(let old_feature of layer.getSource().getFeatures()){
                        if(old_feature.id == feature_id){
                            old_feature.setGeometry(feature.getGeometry())
                            saveDB()
                            break
                        }
                    }
                })
            }
            else{
                let atribNames = []
                let atribValues = []
                for(let key in properties){
                    if(typeof properties[key] == 'undefined' || properties[key] == '' ||
                        typeof props[properties[key]] == 'undefined')
                        continue;
                    atribNames.push(key)
                    atribValues.push(`'${props[properties[key]]}'`)
                }

                let geom = feature.getGeometry()
                geom.transform('EPSG:4326', 'EPSG:3857')
                const format = new ol.format.WKT()
                let feautureString = format.writeFeature(feature)
                feautureString = convertToGeometryType(feautureString)
                let query = `
                    INSERT INTO ${layer.id} (${atribNames.join(', ')}, Geometry)
                    VALUES (${atribValues.join(',')}, GeomFromText('${feautureString}', 3857));
                ;`
                console.log(query)
                requestToDB(query, function(res){
                    feature.id = feature_id
                    feature.layerID = layer.id
                    feature.setStyle(layer.getStyle())
                    layer.getSource().addFeature(feature)
                    saveDB()
                  })          
            }
        }, `Ошибка в импортируемом KML.`)
    }

    function convertToGeometryType(inp_string){
        if(inp_string.search('MULTI') == -1)
            return insert(inp_string, 'MULTI')
        return inp_string
      }

}


function compareGeometryTypes(first, second){
    first = first.toLowerCase()
    second = second.toLowerCase()
    first = first.replace('Multi', '')
    second = second.replace('Multi', '')
    if(first == second)
        return 1
    return 0
}

function convertFeatureToLayerGeometry(feature, layer){
    let new_geom;
    switch(layer.geometryType){
        case "MULTIPOINT":
            new_geom = new ol.geom.Point(feature.getGeometry().getFirstCoordinate())
            break;
        case "MULTIPOLYGON":
            if(feature.getGeometry().getType().search('Point') > -1){
                new_geom = ol.geom.Polygon.circular(feature.getGeometry().getFirstCoordinate(), 1)
            }
            else{
                new_geom = new ol.geom.Polygon(feature.getGeometry().getCoordinates())
            }
            break;
        case "MULTILINESTRING":
            if(feature.getGeometry().getType().search('Point') > -1){
                let first = feature.getGeometry().getFirstCoordinate()
                let second = feature.getGeometry().getFirstCoordinate()
                ol.coordinate.add(second, [0.000001, 0.000001])
                new_geom = new ol.geom.LineString([first, second])
            }
            else{
                new_geom = new ol.geom.LineString(feature.getGeometry().getCoordinates())
            }
            break;
    }
    feature.setGeometry(new_geom)
}

function filterProperties(values, dict, layer){
    for(let key in values){
        if(layer.atribs[dict[key]] == 'DOUBLE'){
            values[key] = values[key].replace(/\D/g, '')
        }
        if(layer.atribs[dict[key]] == 'DATE'){
            let date = new Date(values[key]);
            if(!date instanceof Date && !isNaN(date.valueOf())){
                values[key] = ''
            }
        }
        if(layer.atribs[dict[key]] == 'ENUM'){
            if(options.indexOf(values[key]) == -1){
                values[key] = ''
            }
        }
        if(layer.atribs[dict[key]] == 'BOOLEAN'){
            if(['true', 'false'].indexOf(values[key]) == -1){
                ons.notification.alert(`Ошибка в импортируемом KML.
                 Возможно неккоректное отображение данных`)
            }
        }
    }
    return values
}