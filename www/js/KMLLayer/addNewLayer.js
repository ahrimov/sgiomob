async function addNewLayer() {
  const answer = await ons.notification.confirm({
      title: 'Добавление kml-слоя', 
      message: 'Если Вы будете вносить изменения в добавляемый слой, то, для получения измененного файла, необходимо использовать функцию "Экспорт kml".', 
      buttonLabels: ["Отмена", "Продолжить"]
  }); 
  if (!answer) return;
    fileChooser.open((fileUri) => {
      globalReadlFile(fileUri, (text) => {
        try {
        const fileName = getFileNameFromUri(fileUri);
        const mapProjection = map.getView().getProjection().getCode();
        const format = new ol.format.KML();
        const xmlDoc = new DOMParser().parseFromString(text, 'application/xml');
        if (xmlDoc.querySelector('parsererror') || xmlDoc.documentElement.localName !== 'kml') {
          throw new Error('Файл не является корректным KML.');
        }
        const features = format.readFeatures(text, 
          { dataProjection: 'EPSG:4326', featureProjection: mapProjection }
        );
        if (!features || !features.length) {
          ons.notification.alert({title: "Внимание", message:'Не найдено объектов в файле.'});
          return;
        }

        text = addMissingIdsToKml(text, features);

        let descrLayerId = fileName;
        let schemaName = '';
        const parser = new DOMParser();
        const normalizedDoc = parser.parseFromString(text, "application/xml");

        const schemaElement = normalizedDoc.querySelector("kml > Document > Schema");
        if (schemaElement) {
          schemaName = schemaElement.getAttribute("name");
          if (schemaName) descrLayerId += `_${schemaName}`;
          schemaElement.setAttribute('name', descrLayerId);
          const serializer = new XMLSerializer();
          text = serializer.serializeToString(normalizedDoc);
        } 

        const date = new Date();
        const innerLayerId = descrLayerId + formatDate(date) + '.kml';

        const regex = new RegExp(`^${descrLayerId}(_\\d)?`);
        const similarLayers = layers.filter(layer => regex.test(layer.label));
        if (similarLayers?.length) descrLayerId += ('_' + similarLayers.length);
  
        features.forEach(feature => {
          feature.id = feature.get('ID');
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
                case 'MultiLineString':
                    return new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#2375fa',
                            width: 3,
                        }),
                    });
    
                case 'Polygon':
                case 'MultiPolygon':
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
        for(let i = 0; i < features.length; i++) {
          if (features[i]?.getGeometry().getType() !== geometryType) {
            const topology = convertGeomtetryTypeName(geometryType);
            ons.notification.alert({
              title: 'Внимание',
              message: `В загружаемых данных имеются объекты различных типов геометрии (топологии). Для объектов ${topology} топологии стиль будет предложено изменить вручную. Для остальных топологий будут использованы автоматически созданные стили.` 
            });
            break;
          }
        }
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
          case 'MultiLineString':
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
          case 'MultiPolygon':
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
        const layerAtribs = layerKeys.filter(key => key !== 'geometry' && key !== 'styleUrl').map((key) => { return { name: key, label: key, visible: true, type: 'STRING' } });
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
                  addKMLLayerFileToConfig(innerLayerId);
                  addLayerWithLoading(newLayer);
                },
                onCancel: () => {
                  deleteFile(newLayer.get('fileUri')).catch(error => {
                    console.error('Не удалось удалить временный KML-файл:', error);
                  });
                },
              }});

            }, onError);
          });
        }, onError);
        } catch (error) {
          console.error('Ошибка при добавлении KML-слоя:', error);
          ons.notification.alert({
            title: 'Не удалось добавить KML-слой',
            message: error.message === 'Файл не является корректным KML.'
              ? error.message
              : 'Не удалось обработать KML-файл. Проверьте его формат и попробуйте снова.'
          });
        }
      }, onError);
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

function addMissingIdsToKml(kmlContent, features) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlContent, "application/xml");
  const root = xmlDoc.documentElement;
  const createElement = name => xmlDoc.createElementNS(root.namespaceURI, name);
  let documentNode = Array.from(root.children).find(node => node.localName === 'Document');
  if (!documentNode) {
    documentNode = createElement('Document');
    while (root.firstChild) documentNode.appendChild(root.firstChild);
    root.appendChild(documentNode);
  }

  let schema = documentNode.querySelector('Schema');
  if (!schema) {
    schema = createElement('Schema');
    schema.setAttribute('name', '');
    schema.setAttribute('id', 'DefaultSchema');
    documentNode.insertBefore(schema, documentNode.firstChild);
  }
  if (!schema.getAttribute('id')) schema.setAttribute('id', 'DefaultSchema');
  const schemaId = schema.getAttribute('id');
  const fieldNames = new Set(Array.from(schema.querySelectorAll('SimpleField'), field => field.getAttribute('name')));
  const addField = name => {
    if (!name || fieldNames.has(name)) return;
    const field = createElement('SimpleField');
    field.setAttribute('name', name);
    field.setAttribute('type', 'string');
    schema.appendChild(field);
    fieldNames.add(name);
  };

  const placemarks = xmlDoc.querySelectorAll('Placemark');
  const usedIds = new Set();
  placemarks.forEach((placemark, index) => {
    let extendedData = placemark.querySelector('ExtendedData');
    if (!extendedData) {
      extendedData = createElement('ExtendedData');
      placemark.insertBefore(extendedData, placemark.firstChild);
    }
    let schemaData = extendedData.querySelector('SchemaData');
    if (!schemaData) {
      schemaData = createElement('SchemaData');
      extendedData.appendChild(schemaData);
    }
    schemaData.setAttribute('schemaUrl', `#${schemaId}`);

    Array.from(extendedData.children).filter(node => node.localName === 'Data').forEach(data => {
      const name = data.getAttribute('name');
      if (!name) return;
      addField(name);
      if (!Array.from(schemaData.querySelectorAll('SimpleData')).some(node => node.getAttribute('name') === name)) {
        const simpleData = createElement('SimpleData');
        simpleData.setAttribute('name', name);
        simpleData.textContent = data.querySelector('value')?.textContent || '';
        schemaData.appendChild(simpleData);
      }
      extendedData.removeChild(data);
    });
    schemaData.querySelectorAll('SimpleData').forEach(data => addField(data.getAttribute('name')));

    const feature = features[index];
    const existingId = feature?.get('ID') ?? feature?.get('id');
    let id = existingId === undefined || existingId === null || String(existingId).trim() === ''
      ? String(index)
      : String(existingId);
    while (usedIds.has(id)) id = String(Number(id) + 1 || index + 1);
    usedIds.add(id);
    if (feature) feature.set('ID', id);

    let idData = schemaData.querySelector('SimpleData[name="ID"]');
    if (!idData) {
      idData = createElement('SimpleData');
      idData.setAttribute('name', 'ID');
      schemaData.appendChild(idData);
    }
    idData.textContent = id;
  });

  addField('ID');
  let folder = Array.from(documentNode.children).find(node => node.localName === 'Folder');
  if (!folder) {
    folder = createElement('Folder');
    Array.from(documentNode.children).filter(node => node.localName === 'Placemark').forEach(node => folder.appendChild(node));
    documentNode.appendChild(folder);
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}


// Функция для извлечения имени файла из URI
function getFileNameFromUri(uri) {
    try {
        const decodedUri = decodeURIComponent(uri);
        
        const lastSeparatorIndex = Math.max(
            decodedUri.lastIndexOf('/'),
            decodedUri.lastIndexOf(':')
        );
        
        let fileName = decodedUri.substring(lastSeparatorIndex + 1);
        
        fileName = fileName.split('?')[0];
        fileName = fileName.split('#')[0];
        
        return fileName;
    } catch (e) {
        console.error("Ошибка при получении имени файла:", e);
        return "unknown.kml"; 
    }
}

function convertGeomtetryTypeName(geometryType) {
  switch(geometryType) {
    case 'Point':
    case 'MultiPoint':
      return 'точечной';
    case 'LineString':
    case 'MultiLineString':
      return 'линейной';
    case 'Polygon':
    case 'MultiPolygon':
      return 'площадной';
    default: 
      return geometryType;
  }
}

async function addLayerWithLoading(newLayer) {
    try {
      const loading = new LoadScreen(0, '', () => {
        ons.notification.alert({ 
          title: 'Внимание', 
          message: 'Добавлен новый kml-слой.' 
        });
      });
      loading.startLoad();

      layers.push(newLayer);
      map.addLayer(newLayer);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updatingVectorList();

      loading.finishLoad();
        
    } catch (error) {
        console.error('Ошибка при добавлении слоя:', error);
        ons.notification.alert({ 
            title: 'Ошибка', 
            message: 'Не удалось добавить слой.' 
        });
    }
}

function waitForLayerReady(layer, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function check() {
            if (layer.getSource().getState() === 'ready') {
                resolve();
            } else if (Date.now() - startTime > timeout) {
                reject(new Error('Layer loading timeout'));
            } else {
                setTimeout(check, 100);
            }
        }
        
        check();
    });
}
