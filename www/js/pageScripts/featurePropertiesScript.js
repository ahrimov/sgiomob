function featurePropertiesScript(featureFromPage){
    transformUIToOrientation();
    let clone_raster = new ol.layer.Tile({source: raster.getSource()})
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
    document.querySelector('#cancelModification').addEventListener('click', cancel, false)

    if(!layer.enabled){
        document.querySelector('#feature-instrument-edit').setAttribute('disabled', false);
        document.querySelector('#feature-instrument-edit-geometry').setAttribute('disabled', true);
        document.querySelector('#feature-instrument-delete').setAttribute('disabled', true);
    }

    let navigator = document.querySelector('#myNavigator');
    let page = navigator.topPage;
    page.onDeviceBackButton = function(event){
        if(is_editing_feature){
            ons.notification.confirm({title: 'Потверждение', message: 'Отменить изменения?', buttonLabels: ["Нет", "Да"]}) 
            .then(function(index) {
                if (index === 1) { 
                    cancel();
                }
            });
        }
        else{
            navigator.popPage({times: navigator.pages.length - 1});
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
            //centerOnCurrentFeature()
            navigator.popPage({times: navigator.pages.length - 1});
        })
    }

    function addMetricCharacter(layer, geom){
        if(typeof geom === 'undefined' || geom === ''){
            return ``;
        }
        const format = new ol.format.WKT();
        let wkt = geom
        let feature = format.readFeature(wkt.replace(/nan/g, "0"))
        let geometry = feature.getGeometry()
        let tr = document.createElement("tr");
        switch(layer.geometryType){
            case "MULTIPOINT":
                tr.innerHTML += `<td class='title'>Координаты точки</td>`
                let coords = geometry.getCoordinates()
                let str = coords.toString()
                let arr = str.split(',')
                let lonlat = ol.proj.toLonLat([parseInt(arr[0]), parseInt(arr[1])]);
                tr.innerHTML += `<td class='metric'>${ol.coordinate.toStringXY(lonlat, 5)}</td>`
                break
            case 'MULTILINESTRING':
                tr.innerHTML += `<td class='title'>Длина линии</td>`
                tr.innerHTML += `<td class='metric'>${ol.sphere.getLength(geometry).toFixed(5)}</td>`
                break
            case 'MULTIPOLYGON':
                tr.innerHTML += `<td class='title'>Площадь</td>`
                tr.innerHTML += `<td class='metric'>${ol.sphere.getArea(geometry).toFixed(5)}</td>`
                break
        }
        return tr;
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
        centerOnFeature(feature.getGeometry().getClosestPoint([0,0]))
    }

    function centerOnFeature(center){
        let navigator = document.querySelector('#myNavigator')
        map.getView().setCenter(center)
        /*map.getView().setZoom(map.getView().getMaxZoom())*/
        navigator.popPage({times: navigator.pages.length - 1})
    }

    function clickEditFeature(){
        is_editing_feature = true;
        let content = document.querySelectorAll('.content')
        for(let index in values){
            content[index].innerHTML = inputByType(layer.atribs[index], values[index])
        }

        renderProperties(true)

        document.querySelector('#feature-instruments').style['display'] = 'none'
        document.querySelector('.feature-under-bar').style['display'] = 'block'
    }

    function clickEditGeometry(){
        addModify(layer, feature);
        let navigator = document.querySelector('#myNavigator')
        navigator.popPage({times: navigator.pages.length - 1})
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
            feature.id = values[0]
            saveDB()
        })
        cancel()

    }

    function cancel(){
        is_editing_feature = false;
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
            } 
        }
    }
}

        