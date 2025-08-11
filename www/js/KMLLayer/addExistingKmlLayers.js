async function addExistingKMLLayers() {
    try {
        const folderPath = media_directory + tempKMLDir + '/';
        const files = await getKmlLayerFiles();
        if (!files?.length) return;

        const mapProjection = map.getView().getProjection().getCode();
        const format = new ol.format.KML();

        for (const file of files) {
            if (!file.endsWith('.kml')) continue;
            
            try {
                if (file.endsWith('.kml')) { // Фильтруем только KML-файлы
                    const innerLayerId = file;
                    let descrLayerId = file;

                    const kmlContent = await readFileContent(folderPath + file);
                    if (!kmlContent) continue;
                    const features = format.readFeatures(kmlContent, 
                        { dataProjection: 'EPSG:4326', featureProjection: mapProjection }
                    );

                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(kmlContent, "application/xml");

                    const schemaElement = xmlDoc.querySelector("kml > Document > Schema");
                    if (schemaElement) {
                    const schemaId = schemaElement.getAttribute("id");
                    descrLayerId = schemaId;
                    }

                    const layerAtribs = [];

                    const schemaElements = xmlDoc.getElementsByTagName('Schema');
                            
                    if (schemaElements.length > 0) {
                        const simpleFields = schemaElements[0].getElementsByTagName('SimpleField');
                        for (let i = 0; i < simpleFields.length; i++) {
                            const name = simpleFields[i].getAttribute('name');
                            if (name) {
                                layerAtribs.push({ name, label: name, visible: true });
                            }
                        }
                    }

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
                        style: styleFunction,
                    });
                    newLayer.id = innerLayerId;
                    newLayer.label = descrLayerId;

                                
                    let geometryType = null;
                    const geometryTypeField = xmlDoc.querySelector('SimpleField[name="geometryType"]');
                    if (geometryTypeField) {
                        geometryType = geometryTypeField.getAttribute('actualType');
                    }

                    if (!geometryType && features[0].getGeometry()) {
                        geometryType = features[0].getGeometry().getType();
                    }

                    newLayer.geometryType = geometryType;

                    loadKMLLayerStyle(newLayer, kmlContent, geometryType);

                    newLayer.set('fileUri', media_directory + tempKMLDir + '/' + innerLayerId);
                    newLayer.visible = true;
                    newLayer.set('kmlType', true);
                    newLayer.atribs = layerAtribs;
                    newLayer.enabled = true;

                    layers.push(newLayer);
                    map.addLayer(newLayer);

                    loadLayersVisibility();

                    completeLoad();
                } 
            } catch (error) {
                console.error(`Error processing file ${file}:`, error);
                completeLoad(); // Учитываем и ошибки в подсчёте
            }
        }
    } catch (e) {
        console.error('Error in addExistingKMLLayers:', error);
    }
}


// Функция для получения списка файлов в папке
function listFilesInFolder(folderPath) {
    return new Promise((resolve, reject) => {
        window.resolveLocalFileSystemURL(folderPath, (dirEntry) => {
            const reader = dirEntry.createReader();
            reader.readEntries((entries) => {
                resolve(entries.map(entry => entry.name));
            }, reject);
        }, reject);
    });
}

// Функция для чтения содержимого файла
function readFileContent(filePath) {
    return new Promise((resolve, reject) => {
        window.resolveLocalFileSystemURL(filePath, (fileEntry) => {
            fileEntry.file((file) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(file); // Читаем файл как текст
            }, reject);
        }, reject);
    });
}

function styleFunction (feature) {
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


async function getKmlLayerFiles() {
    const pathToConfig = root_directory + "config.xml";
    const data = await readConfigFile(pathToConfig)
    // Парсинг XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'application/xml');

    // Поиск тега <KMLFiles>
    const kmlFilesNode = xmlDoc.querySelector('storage KML KMLFiles');
    if (!kmlFilesNode || !kmlFilesNode.textContent.trim()) {
        console.log('Тег <KMLFiles> не найден или пуст.');
        return [];
    }

    // Получение списка файлов из <KMLFiles>
    const kmlFiles = kmlFilesNode.textContent.split('|').filter(file => file.trim() !== '');
    console.log(`Найдены KML файлы в конфиге: ${kmlFiles.join(', ')}`);
    return kmlFiles;
}
