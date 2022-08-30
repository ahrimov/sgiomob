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