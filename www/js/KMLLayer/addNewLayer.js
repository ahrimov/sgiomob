function addNewLayer() {
    fileChooser.open((fileUri) => {
      globalReadlFile(fileUri, (text) => {
        const mapProjection = map.getView().getProjection().getCode();
        const format = new ol.format.KML();
        const features = format.readFeatures(text, 
          { dataProjection: 'EPSG:4326', featureProjection: mapProjection }
        );
        if (!features || !features.length) {
          ons.notification.alert({title: "Внимание", message:'Не найдено объектов в файле.'});
          return;
        }

        if (!features[0].get('ID')) {
          text = addMissingIdsToKml(text, features);
        }

        let descrLayerId = 'unknown_id';
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");
        const schemaElement = xmlDoc.querySelector("kml > Document > Schema");
        if (schemaElement) {
          const schemaId = schemaElement.getAttribute("id");
          descrLayerId = schemaId;
        } 

        const date = new Date();
        const innerLayerId = descrLayerId + formatDate(date) + '.kml';

        const regex = new RegExp(`^${descrLayerId}(_\\d)?`);
        const similarLayers = layers.filter(layer => regex.test(layer.label));
        if (similarLayers?.length) descrLayerId += ('_' + similarLayers.length);
  
        let innerFeatureId = 1;
        features.forEach(feature => {
          if (feature.get('ID')) {
            feature.id = feature.get('ID');
          } else {
             const id = innerFeatureId;
             feature.set('ID', id);
             feature.id = id;
             innerFeatureId += 1; 
          }
          feature.layerID = innerLayerId;
          feature.type = 'default';
        });
        const newLayer = new ol.layer.Vector({
          id: innerLayerId, 
          descr: descrLayerId,
          source: new ol.source.Vector( { features }),
          zIndex: minZIndexForVectorLayers,
          style: (feature) => {
            const geometryType = feature.getGeometry().getType();
            switch (geometryType) {
                case 'Point': 
                    return new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 8,
                            fill: new ol.style.Fill({ color: '#2375fa' }),
                            stroke: new ol.style.Stroke({
                                color: 'white',
                                width: 3,
                            }),
                        }),
                    });
    
                case 'LineString': 
                    return new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#2375fa',
                            width: 3,
                        }),
                    });
    
                case 'Polygon': 
                    return new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(35, 117, 250, 0.5)',
                        }),
                        stroke: new ol.style.Stroke({
                            color: '#2375fa',
                            width: 2,
                        }),
                    });
    
                default:
                    return new ol.style.Style(); 
            }
          }
        });
        
        newLayer.id = innerLayerId;
        newLayer.label = descrLayerId;
        const geometryType = features[0].getGeometry().getType();
        newLayer.geometryType = geometryType;
        newLayer.visible = true;
        newLayer.set('kmlType', true);
        newLayer.set('fileUri', media_directory + tempKMLDir + '/' + innerLayerId);
        let style = new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: '#fa2375',
            width: 3,
          }),
        });

        switch (geometryType) {
          case 'Point':
              style =  new ol.style.Style({
                  image: new ol.style.Circle({
                      fill: new ol.style.Fill({color: generateColor()}),
                      radius: 3
                  }),
                  text: new ol.style.Text({
                      fill: new ol.style.Fill({color: '#000000'})
                  })
              });
              break;
          case 'LineString': 
              style = new ol.style.Style({
                  stroke: new ol.style.Stroke({
                      color: generateColor(),
                      width: 2
                  }),
                  text: new ol.style.Text({
                      fill: new ol.style.Fill({color: '#000000'})
                  })
              });
              break;
          case 'Polygon':
              style = new ol.style.Style({
                  fill: new ol.style.Fill({
                      color: generateColor()
                  }),
                  stroke: new ol.style.Stroke({
                      color: 'rgb(0,0,0)',
                      width: 1
                  }),
                  text: new ol.style.Text({
                      fill: new ol.style.Fill({color: '#000000'})
                  })
              });
              break;
        }

        newLayer.setStyle(style);
        features.forEach(feature => {
          feature.setStyle(style);
        });
        const firstFeature = features[0];
        const layerKeys = firstFeature.getKeys()
        const layerAtribs = layerKeys.filter(key => key !== 'geometry' && key !== 'styleUrl').map((key) => { return { name: key, label: key, visible: true } });
        newLayer.atribs = layerAtribs;
        newLayer.enabled = true;

        window.resolveLocalFileSystemURL(media_directory, function(rootDirEntry){
          rootDirEntry.getDirectory(tempKMLDir, { create: true }, function(dirEntry){
            const path = media_directory + tempKMLDir + '/';
            const fileName = innerLayerId;
            const text_ = text;
            saveFile(path, fileName, text_, () => {

              document.querySelector('#myNavigator').pushPage('./views/styleEditor.html', { data: {
                layer: newLayer,
                callback: () => {
                  layers.push(newLayer);
                  map.addLayer(newLayer);
                  updatingVectorList();
                  ons.notification.alert({ title: 'Внимание', message: 'Добавлен новый kml-слой.' });
                },
              }});

            }, onError);
            addKMLLayerFileToConfig(innerLayerId);
          });
        }, onError);
        
      });
    }, { "mime": ".kml,application/vnd.google-earth.kml+xml" }); 
    
  
    function onError(error) {
      ons.notification.alert({title: "Внимание", message:'Произошла ошибка при чтении файла.'});
    }
}

function addKMLLayerFileToConfig(kmlFile) { 
  const pathToConfig = root_directory + "config.xml";
  readConfigFile(pathToConfig).then(data => {
      // Парсинг XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'application/xml');

      // Добавление тега <KMLFiles>
      const storageNode = xmlDoc.querySelector('storage KML');
      if (!storageNode) {
          console.error('Тег <KML> не найден в конфигурационном файле.');
          return;
      }

      let kmlFilesNode = storageNode.querySelector('KMLFiles');
      if (!kmlFilesNode) {
          kmlFilesNode = xmlDoc.createElement('KMLFiles');
          storageNode.appendChild(kmlFilesNode);
      }

      const existingFiles = kmlFilesNode.textContent.split('|').filter(file => file.trim() !== '');
      const updatedFiles = Array.from(new Set([...existingFiles, kmlFile ]));

      // Обновление содержимого <KMLFiles>
      kmlFilesNode.textContent = updatedFiles.join('|');

      // Преобразование обратно в строку
      const serializer = new XMLSerializer();
      const updatedXml = serializer.serializeToString(xmlDoc);

      // Запись обновленного файла
      return writeConfigFile(pathToConfig, updatedXml);
  });
}

function addMissingIdsToKml(kmlContent,features) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlContent, "application/xml");

  const schema = xmlDoc.querySelector('Schema');
  if (!schema) {
    const document = xmlDoc.querySelector('Document');
    schema = xmlDoc.createElement('Schema');
    schema.setAttribute('name', 'DefaultSchema');
    schema.setAttribute('id', 'DefaultSchema');
    document.insertBefore(schema, document.firstChild);
  }

  let idField = Array.from(schema.querySelectorAll('SimpleField')).find(field => field.getAttribute('name') === 'ID');

  if (!idField) {
    idField = xmlDoc.createElement('SimpleField');
    idField.setAttribute('name', 'ID');
    idField.setAttribute('type', 'string');
    schema.appendChild(idField);
  }

  const placemarks = xmlDoc.querySelectorAll('Placemark');

  placemarks.forEach((placemark, index) => {
    const schemaData = placemark.querySelector('SchemaData');
    if (!schemaData) return;

    const idData = placemark.querySelector('SimpleData[name="ID"]');
    if (idData) {
      return;
    }

    const newId = `${index}`;
    if (features[index]) {
      features[index].set('ID', newId);
    }

    const newIdData = xmlDoc.createElement('SimpleData');
    newIdData.setAttribute('name', 'ID');
    newIdData.textContent = newId;

    schemaData.appendChild(newIdData);
  });

  const serializer = new XMLSerializer();
  const updatedKml = serializer.serializeToString(xmlDoc);

  return updatedKml;
}
