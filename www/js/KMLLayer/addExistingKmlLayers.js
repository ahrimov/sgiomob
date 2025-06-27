async function addExistingKMLLayers() {
    const folderPath = media_directory + tempKMLDir + '/';
    const files = await getKmlLayerFiles();

    const mapProjection = map.getView().getProjection().getCode();
    const format = new ol.format.KML();

    for (const file of files) {
        if (file.endsWith('.kml')) { // Фильтруем только KML-файлы
            const innerLayerId = file;
            let descrLayerId = file;
            const kmlContent = await readFileContent(folderPath + file);
            const features = format.readFeatures(kmlContent, 
                { dataProjection: 'EPSG:4326', featureProjection: mapProjection }
            );
            if (!features || !features.length) {
                console.log('В файле ' + file + ' не найдены объекты.');
                continue;
            }

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(kmlContent, "application/xml");
            const schemaElement = xmlDoc.querySelector("kml > Document > Schema");
            if (schemaElement) {
              const schemaId = schemaElement.getAttribute("id");
              descrLayerId = schemaId;
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
            const geometryType = features[0].getGeometry().getType();
            newLayer.geometryType = geometryType;
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
            newLayer.visible = true;
            newLayer.set('kmlType', true);
            newLayer.set('fileUri', media_directory + tempKMLDir + '/' + innerLayerId);
            const firstFeature = features[0];
            const layerKeys = firstFeature.getKeys();
            const layerAtribs = layerKeys.filter(key => key !== 'geometry').map((key) => { return { name: key, label: key, visible: true } });
            newLayer.atribs = layerAtribs;
            newLayer.enabled = true;

            layers.push(newLayer);
            map.addLayer(newLayer);

            completeLoad();
        }
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

    
    function readConfigFile(filePath) {
        return new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(filePath, function (fileEntry) {
                fileEntry.file(function (file) {
                    const reader = new FileReader();
                    reader.onloadend = function () {
                        resolve(reader.result);
                    };
                    reader.onerror = reject;
                    reader.readAsText(file);
                }, reject);
            }, reject);
        });
    }
}
