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
        saveFile(root_directory + pathToKMLStorage, layer.id + Date.now() + '.kml', kml)
    })
}

function importKML(layerID, properties, features){
    let layer = findLayer(layerID)
    for(let feature of features){
        let props = feature.getProperties()
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
                updates.push(`Geometry = GeomFromText('${feautureString}', 3857)`)
                query = `UPDATE ${layer.id } SET ${updates.join(', ')} WHERE ${layer.atribs[0].name} = ${feature_id} `
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
                
            }
        })
    }

}