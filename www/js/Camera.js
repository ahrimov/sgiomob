function setOptions(srcType) {
    var options = {
        // Some common settings are 20, 50, and 100
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        // In this app, dynamically set the picture source, Camera or photo gallery
        sourceType: srcType,
        correctOrientation: true
    }
    return options;
}

function openCamera(succes, fail) {

    var srcType = Camera.PictureSourceType.CAMERA;
    var options = setOptions(srcType);
    //var func = getFileEntry;

    navigator.camera.getPicture(succes, fail, options);

    /*
    navigator.camera.getPicture(function cameraSuccess(imageUri) {

        //displayImage(imageUri);
        // You may choose to copy the picture, save it somewhere, or upload.
        func(imageUri, displayContainer, imgName);

    }, function cameraError(error) {
        console.debug("Unable to obtain picture: " + error, "app");

    }, options);*/
}
/*
function displayImage(imgUri, displayContainer) {
    displayContainer.src = imgUri;
}*/


function saveImage(imgEntry, imgName, layer, feature, success_func){
    window.resolveLocalFileSystemURL(root_directory + pathToImageStorage, function success(dirEntry){
        imgEntry.copyTo(dirEntry, imgName, function(){
            requestToDB(`SELECT lg_attach as im FROM ${layer.id} WHERE ${layer.atribs[0].name} = ${feature.id}`, function(data){
                let lg_attach = data.rows.item(0).im
                if(typeof lg_attach == 'undefined')
                    lg_attach = ''
                lg_attach += root_directory + pathToImageStorage + imgName + '|'
                requestToDB(`UPDATE ${layer.id} SET lg_attach = '${lg_attach}' WHERE ${layer.atribs[0].name} = ${feature.id}`, function(res){
                    saveDB()
                    success_func(root_directory + pathToImageStorage + imgName)
                })
            })
        })
    })
}

function getImagesFromStorage(layer, feature, success){
    const query = `SELECT lg_attach as im FROM ${layer.id} WHERE ${layer.atribs[0].name} = ${feature.id}`
    requestToDB(query, function(data){
        let pathsToImages = data.rows.item(0).im
        if(typeof pathsToImages == 'undefined')
            pathsToImages = []
        else
            pathsToImages = pathsToImages.split("|")
        success(pathsToImages)
    })
}