function newFeatureScipt(pageLayer, pageFeature){
    let layer = pageLayer;
    let feature = pageFeature;   
    let featureImages = []
    let content  = '<table>'
    for(let atrib of layer.atribs){
        if(checkServiceField(atrib.name))
        continue
        let line = `<tr>
                <td class='title'>${atrib.label}</td>
                <td class='input'>
                ${inputByType(atrib)}
                </td>
            </tr>`
        content += line
    }
    content += `</table>`;
    document.querySelector('#add-feature-content').innerHTML = content;

    let template_gallery = document.querySelector('#photogallery');
    let clone_gallery = template_gallery.content.cloneNode(true);
    document.querySelector('#add-feature-content').appendChild(clone_gallery);
    document.querySelector('#addNewPhoto').addEventListener('click', clickOpenCamera, false)


    document.querySelector('#saveFeatureButton').addEventListener('click', saveFeature, false)
    document.querySelector('#backButton').addEventListener('click', back, false)

    autonumericID(layer.atribs[0].name, layer).then((new_id) => {
    document.querySelector(`#${layer.atribs[0].name}`).value = new_id
    })

    function back(){
        document.querySelector('#myNavigator').popPage();
    }

    function saveFeature(){
        let atribNames = []
        let atribValues = []
        for(let atrib of layer.atribs){
        if(checkServiceField(atrib.name))
            continue
        if(atrib.type == 'BOOLEAN'){
            atribNames.push(atrib.name)
            if(document.querySelector(`#${atrib.name}`).checked == true)
            atribValues.push(1)
            else
            atribValues.push(0)
        }
        else{
            let value = document.querySelector(`#${atrib.name}`).value
            if(value != ''){
            atribNames.push(atrib.name)
            atribValues.push(`'${value}'`)
            }
        }
        }
        const format = new ol.format.WKT()
        let feautureString = format.writeFeature(feature)
        feautureString = convertToGeometryType(feautureString)
        let query = `
                    INSERT INTO ${layer.id} (${atribNames.join(', ')}, Geometry)
                    VALUES (${atribValues.join(',')}, GeomFromText('${feautureString}', 3857));
                    ;`
        console.log(query)
        requestToDB(query, function(res){
        let id = document.querySelector(`#${layer.atribs[0].name}`).value
        feature.id = id
        feature.layerID = layer.id
        finishDraw()
        document.querySelector('#myNavigator').popPage();

        if(featureImages.length > 0)
            saveImageToNewFeature();

        saveDB();
        }) 
    }

    async function saveImageToNewFeature(){
    let i = 0;
    saveImageInDB(i, layer, feature);
    }

    function saveImageInDB(i, layer, feature){
    saveImage(featureImages[i].imageEntry, featureImages[i].imageName, featureImages[i].image_options, layer, feature, function(imgUri){
        i++;
        if(i < featureImages.length){
        saveImageInDB(i, layer, feature)
        }
    })
    }

    function inputByType(atrib){
    switch(atrib.type){
        case 'DOUBLE':
        return `<ons-input id='${atrib.name}' modifier="underbar" type="number" placeholder="Числовые данные" float></ons-input>`
        case 'DATE':
        return `<ons-input id='${atrib.name}' modifier="underbar" type="date" float></ons-input>`
        case 'BOOLEAN':
        return `<ons-checkbox id='${atrib.name}'></ons-checkbox>`
        case 'ENUM':
        let select = `<ons-select id='${atrib.name}' onclick="callModalSelectWithLayerAtribs('${layer.id}', '${atrib.name}', '${atrib.name}')">`
        for(let code in atrib.options){
            select += `<option value='${code}'>${atrib.options[code]}</option>`
        }
        select += `</ons-select>`
        return select
        default:
        return `<ons-input id='${atrib.name}' modifier="underbar" placeholder="Текстовые данные" float></ons-input>`
    }
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


    //camera function (dublicate) 

    function clickOpenCamera(){
    try{
        openCamera(function(imgUri){
            getFileEntry(imgUri, function(fileEntry){

                firstImage();

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

                let image = {imageEntry: fileEntry, imageName: imageName, image_options : image_options};
                featureImages.push(image);

                let gallery = document.querySelector('.gallery');
                displayImage(fileEntry.toInternalURL(), gallery);

            }, function(error){
                console.log(`Cann't save image: ` + error)
                ons.notification.alert({title:"Внимание", message: 'Невозможно сохранить изображение'});
            })
        }, function(error){
            console.log(`Image didn't create`);
            //ons.notification.alert({title:"Внимание", message: 'Ошибка камеры'});
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
            if(image_options.length == 0)
                return
                
            firstImage()
            let gallery = document.querySelector('.gallery')
            for(let elem of image_options){
                pathToImage = elem.path.replace(/\\\//g, '/');
                getFileEntry(root_directory + pathToImage, function(fileEntry){
                    displayImage(fileEntry.toInternalURL(), gallery)
                }, function(error){
                    ons.notification.alert({title:'Внимание', message: `Не удалось загрузить изображение: ${pathToImage}`})
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
}