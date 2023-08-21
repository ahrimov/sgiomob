function featurePropertiesScript(featureFromPage){
    transformUIToOrientation();
    const visibleBaseLayer = baseRasterLayers.filter(layer => layer.get('visible'));
    const currentBaseLayer = visibleBaseLayer.sort((a, b) => b.getZIndex() - a.getZIndex())[0];
    let clone_raster;
    if(typeof currentBaseLayer === 'undefined')
        clone_raster = new ol.layer.Tile({source: new ol.source.OSM({})});
    else 
        clone_raster = new ol.layer.Tile({source: currentBaseLayer.getSource()});
    var local_map = new ol.Map({
            target: 'local-map',
            controls: [],
            interactions: [],
            layers: [clone_raster]
        });
    let feature = featureFromPage;
    if(typeof feature.getGeometry() === 'undefined'){
        ons.notification.alert({title:"Внимание", message:`Ошибка в геометрии объекта.`});
    }
    let layer = findLayer(feature.layerID)
    let atribs = []
    let values = []
    let images = []
    let is_editing_feature = false;
    for(atrib of layer.atribs){
        if(checkServiceField(atrib.name)){
            continue;
        }
        atribs.push(atrib.name);
    }
    let query = "SELECT AsText(Geometry) as geom, " + atribs.join(', ') + " from " + layer.id + 
    " WHERE id = " + feature.id;
    requestToDB(query, function(data){
        var table = document.createElement("table");
        for(atrib of layer.atribs){
            if(checkServiceField(atrib.name)){
                continue;
            }
            let tr = document.createElement("tr");
            tr.className = "property";
            let td_title = document.createElement("td");
            td_title.className = 'title';
            td_title.textContent = atrib.label;
            tr.append(td_title);
            let td_content = document.createElement("td");
            td_content.className = 'content';
            let content = contentByType(atrib, data.rows.item(0)[atrib.name]);
            if(content === '' || typeof content === "undefined"){
                tr.style['visibility'] = 'collapse';
            }
            td_content.innerHTML = content;
            tr.append(td_content);
            if(!atrib.visible){
                tr.style.visibility = 'collapse';
            }
            table.append(tr);

            values.push(data.rows.item(0)[atrib.name]);
        }
        table.append(addMetricCharacter(layer, data.rows.item(0).geom));
        document.getElementById("table").append(table);
    })

    displayLocalMap()
    displayImagesFromStorage()

    document.querySelector('#addNewPhoto').addEventListener('click', clickOpenCamera, false)

    document.querySelector('#feature-instrument-map').addEventListener('click', centerOnCurrentFeature, false)
    document.querySelector('#feature-instrument-edit').addEventListener('click', clickEditFeature, false)
    document.querySelector('#feature-instrument-edit-geometry').addEventListener('click', clickEditGeometry, false)
    document.querySelector('#feature-instrument-delete').addEventListener('click', clickDeleteFeature, false)

    document.querySelector('#saveModificationFeature').addEventListener('click', updateFeature, false)
    document.querySelector('#cancelModification').addEventListener('click', safetyCancel, false)

    document.querySelector('#feature-properties-back-button').addEventListener('click', () => {
        if(is_editing_feature){
            safetyCancel();
        }
    }, false);

    if(!layer.enabled){
        document.querySelector('#feature-instrument-edit').setAttribute('disabled', false);
        document.querySelector('#feature-instrument-edit-geometry').setAttribute('disabled', true);
        document.querySelector('#feature-instrument-delete').setAttribute('disabled', true);
    }

    let navigator = document.querySelector('#myNavigator');
    let page = navigator.topPage;
    page.onDeviceBackButton = function(event){
        if(is_editing_feature){
            safetyCancel();
        }
        else{
            navigator.popPage({times: navigator.pages.length - 1});
        }
    }

    function safetyCancel(event){
        if(is_editing_feature){
            ons.notification.confirm({
                title: 'Потверждение', 
                message: 'Отменить изменения?', 
                buttonLabels: ["Нет", "Да"]
            }) 
            .then(function(index) {
                if (index === 1) { 
                    cancel();
                }
            });
        }
    }


    function contentByType(atrib, content){
        switch(atrib.type){
        case 'DATE':
            let date_insp = content;
            if(date_insp !== 0 && typeof date_insp !== 'undefined' && date_insp !== ''){
                let date = new Date(date_insp).toLocaleString('ru-RU',  {year: 'numeric',month: 'numeric',day: 'numeric'});
                if(date === "Invalid Date"){
                    return "Некорректная дата";
                }
                return date;
            }
            return '';
        case 'BOOLEAN':
            let check = ''
            if(content === 1)
                check = 'checked'
            return `<ons-checkbox id='${atrib.name}' ${check}  disabled></ons-checkbox>`
        case 'ENUM':
                return atrib.options[content];
        default:
            if(typeof content === 'undefined')
                return ''
            return content
        }
    }


    function inputByType(atrib, content){
        switch(atrib.type){
        case 'DOUBLE':
            if(typeof content === 'undefined' || content === '')
                return `<ons-input id='${atrib.name}' class='input-content' modifier="underbar" type="number" placeholder="Числовые данные" float></ons-input>`
            return `<ons-input id='${atrib.name}' class='input-content' value='${content}' type="number" modifier="underbar" float  ></ons-input>`
        case 'DATE':
            if(typeof content === 'undefined' || content === '')
                return `<ons-input id='${atrib.name}' class='input-content' modifier="underbar" type="date" float></ons-input>`
            let date = new Date(content).toLocaleString('ru-RU',  {year: 'numeric',month: 'numeric',day: 'numeric'});
            let date_string = date.toString();
            let pattern = /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/;
            if(date_string.search(pattern) === 0){
                content = date_string.replace(pattern,'$3-$2-$1');
            }
            return `<ons-input id='${atrib.name}' class='input-content' value='${content}' modifier="underbar" type="date" float  ></ons-input>`
        case 'BOOLEAN':
            let check = ''
            if(content === 1)
                check = 'checked'
            return `<ons-checkbox id='${atrib.name}' ${check}  class='input-content'></ons-checkbox>`
        case 'ENUM':
            let select = `<ons-select id='${atrib.name}' class='input-content' value='${content}' onclick="callModalSelectWithLayerAtribs('${layer.id}','${atrib.name}', '${atrib.name}')">`
            for(let code in atrib.options){
                let selected = '';
                if (code == content){
                    selected = `selected="selected"`
                }
                select += `<option value='${code}' ${selected}>${atrib.options[code]}</option>`
            }
            select += `</ons-select>`
            return select
        default:
            if(typeof content === 'undefined' || content === '')
                return `<ons-input id='${atrib.name}' class='input-content' modifier="underbar" placeholder="Текстовые данные" float></ons-input>`
            return `<ons-input id='${atrib.name}' class='input-content' value='${content}' modifier="underbar" float></ons-input>`
        }
    }

    function displayLocalMap(){
        let source = new ol.source.Vector()
        if(typeof feature.getGeometry() !== 'undefined')
            source.addFeature(feature)
        let clonedLayer = new ol.layer.Vector({
            style: layer.getStyle()
        });
        clonedLayer.setSource(source)
        local_map.addLayer(clonedLayer)
        local_map.getView().fit(source.getExtent())

        local_map.on('click', function(evt){
            navigator.popPage({times: navigator.pages.length - 1});
        })
    }

    function addMetricCharacter(layer, geom){
        if(typeof geom === 'undefined' || geom === ''){
            return ``;
        }
        const format = new ol.format.WKT();
        let wkt = geom;
        let feature = format.readFeature(wkt.replace(/nan/g, "0"))
        let geometry = feature.getGeometry()
        let tr = document.createElement("tr");
        tr.className = 'geometry-property';
        fillGeometryProperty(tr, geometry, layer.geometryType);
        return tr;
    }

    function fillGeometryProperty(element, geometry, geometryType){
        switch(geometryType){
            case "MULTIPOINT":
                element.innerHTML += `<td class='title'>Координаты точки</td>`
                let coords = geometry.getCoordinates()
                let str = coords.toString()
                let arr = str.split(',')
                let lonlat = ol.proj.toLonLat([parseInt(arr[0]), parseInt(arr[1])]);
                element.innerHTML += `<td class='metric'>${ol.coordinate.toStringXY(lonlat, 7)}</td>`
                break
            case 'MULTILINESTRING':
                element.innerHTML += `<td class='title'>Длина линии</td>`
                element.innerHTML += `<td class='metric'>${ol.sphere.getLength(geometry).toFixed(7)}</td>`
                break
            case 'MULTIPOLYGON':
                element.innerHTML += `<td class='title'>Площадь</td>`
                element.innerHTML += `<td class='metric'>${ol.sphere.getArea(geometry).toFixed(7)}</td>`
                break
        }
    }

    function updateGeometryProperty(geometry, geometryType){
        const element = document.querySelector('.geometry-property');
        element.innerHTML = '';
        fillGeometryProperty(element, geometry, geometryType);
    }

    //camera function
    function clickOpenCamera(){
        try{
            openCamera(function(imgUri){
                getFileEntry(imgUri, function(fileEntry){

                    firstImage()

                    let date = new Date()  
                    let imageName = `${layer.id}${formatDate(date)}.jpg`
                    let pathToImage = './' + pathToImageStorage + imageName
                    pathToImage = pathToImage.replace(/\//g, String.raw`\/`)
                    let image_options = {
                        path: pathToImage,
                        created: date.toISOString(),
                        mimeType:"image" + String.raw`\/` + "jpeg",
                        desc:""
                    }
                    
                    saveImage(fileEntry, imageName, image_options, layer, feature, function(imgUri){
                        getFileEntry(imgUri, function(){
                            let gallery = document.querySelector('.gallery')
                            displayImage(fileEntry.toInternalURL(), gallery)
                        })
                    })
                }, function(error){
                    console.log(`Cann't save image: ` + error)
                    ons.notification.alert({title:"Внимание", message: 'Невозможно сохранить изображение'})
                })
            }, function(error){
                console.log(`Image didn't create`);
                //ons.notification.alert({title:"Внимание", message: 'Ошибка камеры'})
            })
        }
        catch(err){
            ons.notification.alert({title:"Внимание", message: 'Что-то пошло не так'})
        }
    }


    function displayImage(image, container){
        let image_element = document.createElement('img')
        image_element.className = "pre-image"
        image_element.src = image
        container.appendChild(image_element)
    }

    function displayImagesFromStorage(){
        getImagesFromStorage(layer, feature, function(image_options){
            if(image_options.length === 0)
                return
                
            firstImage()
            let gallery = document.querySelector('.gallery')
            for(let elem of image_options){
                pathToImage = elem.path.replace(/\\\//g, '/');
                getFileEntry(root_directory + pathToImage, function(fileEntry){
                    displayImage(fileEntry.toInternalURL(), gallery)
                }, function(error){
                    ons.notification.alert({title:"Внимание", messageHTML: `<p class="notification-alert">Не удалось загрузить изображение: ${pathToImage}</p>`})
                })
            }
        })
    }

    function firstImage(){
        if(typeof firstImage.counter == 'undefined'){
            firstImage.counter = 0
            changeAddPhotoButton()
            let gallery = document.createElement('div')
            gallery.className = "gallery"
            document.querySelector('#photos').appendChild(gallery)
        }
        else
            return
    }

    function changeAddPhotoButton(){
        let addNewPhoto = document.querySelector('#addNewPhoto')
        addNewPhoto.remove()
        addNewPhoto = ons.createElement(`<ons-button modifier="outline light" id="addNewPhoto"></ons-button>`)
        addNewPhoto.innerHTML = `<div class='signature'>
            <ons-icon icon="md-plus" size="20px"></ons-icon></div>`
        addNewPhoto.style['width'] = "25%"
        addNewPhoto.style['float'] = 'right'
        document.querySelector('#photos').appendChild(addNewPhoto)
        document.querySelector('#addNewPhoto').addEventListener('click', clickOpenCamera, false)
    }


    function centerOnCurrentFeature(){
        centerOnFeature(feature.getGeometry().getClosestPoint([0,0]));
    }

    function centerOnFeature(center){
        let navigator = document.querySelector('#myNavigator');
        map.getView().setCenter(center);
        navigator.popPage({times: navigator.pages.length - 1});
    }

    function clickEditFeature(){
        is_editing_feature = true;
        needsCancelNavigator = true;
        let content = document.querySelectorAll('.content')
        for(let index in values){
            content[index].innerHTML = inputByType(layer.atribs[index], values[index]);
        }

        renderProperties(true)

        document.querySelector('#feature-instruments').style['display'] = 'none'
        document.querySelector('.feature-under-bar').style['display'] = 'block'
    }

    function clickEditGeometry(){
        ons.createElement('chooseTypeEditGeometry', {append: true})
            .then(function(dialog){
                document.querySelector('#choose-type-edit-geometry-button').addEventListener('click', () => {
                  const mapRadio = document.querySelector('#choose-type-edit-geometry-map');
                  const manualRadio = document.querySelector('#choose-type-edit-geometry-manual');
                  if(mapRadio.checked){
                    addModify(layer, feature);
                    const navigator = document.querySelector('#myNavigator')
                    navigator.popPage({times: navigator.pages.length - 1})
                  }
                  else if (manualRadio){
                    createDialogManualEditGeometry();
                  }
                  hideDialog('choose-type-edit-geometry');
                }, false)
                dialog.show()
            });
    }

    function createDialogManualEditGeometry(){
        const geometry = feature.getGeometry();
        let coordinates = geometry.getCoordinates();
        let typeOfCoordinates = 'decimal';
        if(geometry.getType() === 'MultiLineString' || geometry.getType() === 'MultiPolygon'){
            coordinates = coordinates[0];
        }
        ons.createElement('manualInputCoordinates', {append: true})
            .then(function(dialog){
                updateTableCoordinates();
                if(geometry.getType() === 'Point' || geometry.getType() === 'MultiPoint'){
                    document.querySelector('#manual-edit-geometry-add-coordinate-button').style.display = 'none';
                } 
                document.querySelector('#manual-edit-geometry-add-coordinate-button').addEventListener('click', () => {
                    createDialogEditCoordinate([], typeOfCoordinates, (coordinate) => {
                        const newCoord = ol.proj.fromLonLat(coordinate, map.getView().getProjection());
                        if(isNaN(newCoord[0]) || isNaN(newCoord[1])) {
                            ons.notification.toast('Некорректный ввод. Отмена операции', {timeout: 1000, animation: "ascend"});
                            return;
                        }
                        coordinates.push(newCoord);
                        updateTableCoordinates();
                    })
                });
                document.querySelector('#type-coordinatees-switcher-meters').addEventListener('change', () => {
                    typeOfCoordinates = 'decimal';
                    updateTableCoordinates();
                });
                document.querySelector('#type-coordinatees-switcher-degrees').addEventListener('change', () => {
                    typeOfCoordinates = 'degrees';
                    updateTableCoordinates();
                });
                document.querySelector('#edit-geometry-save-changes').addEventListener('click', () => {
                    updateFeatureGeometry(coordinates);
                    hideDialog('manual-input-coordinates');
                });
                document.querySelector('#edit-geometry-cancel-changes').addEventListener('click', () => {
                    hideDialog('manual-input-coordinates');
                });
                dialog.show();
            });

        function updateTableCoordinates(){
            const tableTbody = document.querySelector('.table-coordinates-tbody');
            tableTbody.innerHTML = '';
            const template = document.querySelector('#manualInputCoordinatesTable');
            for(let i in coordinates){ 
                const tableElement = template.content.cloneNode(true);
                const lonLatCoordinate = ol.proj.toLonLat(coordinates[i]);
                tableElement.querySelector('.numberOfCoordinate').textContent = parseInt(i) + 1;
                const lon = typeOfCoordinates === 'degrees' ? 
                    transformDecimalToMinutesAndSeconds(lonLatCoordinate[0].toFixed(7)) : lonLatCoordinate[0].toFixed(7);
                const lat = typeOfCoordinates === 'degrees' ? 
                    transformDecimalToMinutesAndSeconds(lonLatCoordinate[1].toFixed(7)) : lonLatCoordinate[1].toFixed(7);
                tableElement.querySelector('.longtitude').textContent = lon;
                tableElement.querySelector('.latitude').textContent = lat;
                tableElement.querySelector('.manual-input-coordinates-tr').addEventListener('click', () => {
                    createDialogEditCoordinate(lonLatCoordinate, typeOfCoordinates, (coordinate) => {
                        const newCoord = ol.proj.fromLonLat(coordinate, map.getView().getProjection());
                        if(isNaN(newCoord[0]) || isNaN(newCoord[1])){
                            ons.notification.toast('Некорректный ввод. Отмена операции', {timeout: 1000, animation: "ascend"});
                            return;
                        }
                        coordinates[i] = newCoord;
                        updateTableCoordinates();
                    });
                });
                tableElement.querySelector('.delete-button').addEventListener('click', (event) => {
                    event.stopPropagation();
                    coordinates.splice(i, 1);
                    updateTableCoordinates();
                });
                tableTbody.appendChild(tableElement);
            }
            if(coordinates.length === 0){
                document.querySelector('#manual-edit-geometry-add-coordinate-button').style.display = 'block';
            }
            else if(geometry.getType() === 'Point' || geometry.getType() === 'MultiPoint'){
                document.querySelector('#manual-edit-geometry-add-coordinate-button').style.display = 'none';
            }
        }
    }

    function createDialogEditCoordinate(coordinate = [], typeOfCoordinates, callback){
        ons.createElement('dialogEditCoordinate', {append: true})
            .then(function(dialog){
                //const dialogContainer = document.querySelector('#dialog-edit-coordinate-content');
                const dialogContent = document.querySelector('.dialog-edit-coordinate-content');
                const inputContainer = document.querySelector('.dialog-edit-coordinate-inputs');
                //const lonInputElement = dialogContent.querySelector('#longtitude');
                //const latInputElement = dialogContent.querySelector('#latitude');
                //let mask; 
                // let lon = 0, lat = 0;
                if(typeOfCoordinates === 'decimal'){
                    const template = dialogContent.querySelector('#dialog-edit-coordinate-inputs-meters');
                    const inputs = template.content.cloneNode(true);
                    inputContainer.appendChild(inputs);
                    if(coordinate.length > 0){
                        dialogContent.querySelector('#longtitude').value = coordinate[0].toFixed(7);
                        dialogContent.querySelector('#latitude').value = coordinate[1].toFixed(7);
                    }
                } else {
                    const template = dialogContent.querySelector('#dialog-edit-coordinate-inputs-degrees');
                    const inputs = template.content.cloneNode(true);
                    const templateDegreeInput = inputs.querySelector('#input-degrees');
                    for(let i in [0, 1]){
                        const degreeInput = templateDegreeInput.content.cloneNode(true);
                        inputContainer.appendChild(degreeInput);
                    }
                    if(coordinate.length > 0){
                        for(let i in [0, 1]){
                            const c = transformDecimalToMinutesAndSeconds(coordinate[1-i].toFixed(7));
                            dialogContent.getElementsByClassName('idegree')[i].value = c.slice(0, c.indexOf('°'));
                            dialogContent.getElementsByClassName('iminute')[i].value = c.slice(c.indexOf('°') + 1, c.indexOf('\''));
                            dialogContent.getElementsByClassName('isec')[i].value = c.slice(c.indexOf('\'') + 1, c.indexOf('\"'));
                        }
                    }
                }
                dialogContent.querySelector('#edit-coordinate-save-changes').addEventListener('click', () => {
                    let newCoord = [];
                    if(typeOfCoordinates === 'degrees'){
                        const inputs =  document.getElementsByClassName('input-degrees-container'); 
                        for(let input of inputs){
                            let degree = input.querySelector('.idegree').value + '°' + input.querySelector('.iminute').value +
                                '\'' + input.querySelector('.isec').value + '\"';
                            let decimal = transformToDecimal(degree);
                            newCoord.push(decimal);
                        }
                        newCoord = newCoord.reverse();
                    } else {
                        let lon = dialogContent.querySelector('#longtitude').value;
                        let lat = dialogContent.querySelector('#latitude').value;
                        newCoord = [lon, lat];
                    }
                    callback(newCoord);
                    hideDialog('dialog-edit-coordinate');
                });
                dialogContent.querySelector('#edit-coordinate-cancel-changes').addEventListener('click', () => {
                    hideDialog('dialog-edit-coordinate');
                });
                dialog.show();
            });
    }

    function clickDeleteFeature(){
        ons
        .notification.confirm({title: 'Удаление', message: 'Вы уверены, что хотите удалить элемент?', buttonLabels: ["Нет", "Да"]})
        .then(function(index) {
            if(index === 1)
                deleteCurrentFeature()
        });
    }

    function deleteCurrentFeature(){
        const query = `DELETE FROM ${feature.layerID} WHERE id='${feature.id}';`
        requestToDB(query, function(res){
            layer.getSource().removeFeature(feature)
            saveDB()

            let navigator = document.querySelector('#myNavigator')
            navigator.popPage({times: navigator.pages.length - 1})
        })
    }

    function updateFeatureGeometry(coordinates){
        const geometry = feature.getGeometry();
        if(geometry.getType() === 'MultiLineString' || geometry.getType() === 'MultiPolygon'){
            feature.getGeometry().setCoordinates([coordinates]);
        }
        else{
            feature.getGeometry().setCoordinates(coordinates);
        }
        local_map.getView().fit(geometry.getExtent());
        const format = new ol.format.WKT();
        let feautureString = format.writeFeature(feature);
        // feautureString = convertToGeometryType(feautureString);
        const query = `UPDATE ${layer.id } SET Geometry = GeomFromText('${feautureString}', 3857) WHERE ${layer.atribs[0].name} = ${feature.id}`;
        requestToDB(query, function(res){
            saveDB();
            updateGeometryProperty(geometry, layer.geometryType);
        });
    }

    function convertToGeometryType(inp_string){
        let string = insert(inp_string, ' Z', inp_string.search(/\(\(/))
        let res = string.matchAll(/,/g)
        let offset = 0
        for(let r of res){
            string = insert(string, ' 0', r.index + offset)
            offset += 2
        }
        return insert(string, ' 0', string.search(/\)\)/))
    }

    function updateFeature(){
        let updates = []
        let input_content = document.querySelectorAll('.input-content')
        for(let index in values){
            if(layer.atribs[index].type === 'BOOLEAN'){
                if(input_content[index].checked)
                    values[index] = 1;
                else
                    values[index] = 0; 
            }
            else{
                values[index] = input_content[index].value;
            }
            if(values[index] === ''){
                continue
            }
            updates.push(`${atribs[index]} = '${values[index]}'`)
        }
        const query = `UPDATE ${layer.id } SET ${updates.join(', ')} WHERE ${layer.atribs[0].name} = ${feature.id}`
        requestToDB(query, function(res){
            feature.id = values[0];
            const typeIndex = atribs.indexOf('type_cl');
            if(typeIndex >= 0){
                feature.type = values[typeIndex];
            }
            feature.changed();
            saveDB();
        })
        cancel()

    }

    function cancel(){
        is_editing_feature = false;
        needsCancelNavigator = false;
        let input_content = document.querySelectorAll('.input-content')
        for(let index in values){
            input_content[index].remove()
        }
        let content = document.querySelectorAll('.content')
        for(let index in values){
            content[index].innerHTML = contentByType(layer.atribs[index], values[index])
        }
        renderProperties(false)

        document.querySelector('.feature-under-bar').style['display'] = 'none'
        document.querySelector('#feature-instruments').style['display'] = 'block'
    }

    function renderProperties(visibility){
        if(visibility){
            visibility = 'visible'
        }
        else{
            visibility = 'collapse'
        }
        let property_lines = document.querySelectorAll('.property');
        for(let index in values){
            if(layer.atribs[index].type === 'BOOLEAN'){
                return;
            }
            if(property_lines[index].querySelector('.content').textContent === ''){
                property_lines[index].style['visibility'] = visibility;
                if(!layer.atribs[index].visible){
                    property_lines[index].style['visibility'] = 'collapse';
                }
            } 
        }
    }
}

        