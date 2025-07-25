function openFile(path, post_processing){
    window.resolveLocalFileSystemURL(path, function(file) {
        file.file(function (file) {
            var reader = new FileReader();
            reader.onloadend = function(evt){
                post_processing(this.result, file.name)
            }
            reader.readAsText(file, 'utf-8');
        })
    }, function(error){
        console.log("Error while open file:", path)
        ons.notification.alert({title:"Внимание", messageHTML:`<p class="notification-alert">Ошибка при открытии файла: ${path} </p>`})
    })
}

function getFileEntry(path, success, fail) {
    window.resolveLocalFileSystemURL(path, success, fail);
}

function writeFileText(fileEntry, text, success, fail) {
    fileEntry.createWriter(function (fileWriter) {

        fileWriter.onwriteend = function() {
            success();
        };

        fileWriter.onerror = function (e) {
            console.log("Failed file write: " + e.toString());
            fail();
        };

        const dataObj = new Blob([text], { type: 'text/plain' });

        fileWriter.write(dataObj);
    });
}

function getFolder(dirName, callback){
    window.resolveLocalFileSystemURL(root_directory, function(rootDirEntry){
        rootDirEntry.getDirectory(dirName, {create: true}, function(dirEntry){
            callback(dirEntry)
        }, function(error){
            console.log("Error while create folder:" + error.message)
        })
    }, function (error){
        ons.notification.alert({title:"Внимание", message:`Невозможно открыть директорию. Ошибка:` + error})
    })
}

function checkIfFileExists(path, fileExists, fileDoesNotExist){
    window.resolveLocalFileSystemURL(path, fileExists,  fileDoesNotExist)
}

function saveFile(pathDir, fileName, fileData, success, onError) {
    const innerOnError = (error) => { ons.notification.alert({title:"Внимание", message:`Невозможно создать файл. Ошибка:` + error}) };
    const onError_ = onError ?? innerOnError;
    window.resolveLocalFileSystemURL(pathDir, function(dirEntry){
        dirEntry.getFile(fileName, {create: true}, function(fileEntry){
            writeFile(fileEntry,  fileData);
            if (success) success();
        }, onError_);
    }, (e) => {
        console.log(e);
    });

    function writeFile(fileEntry, dataObj) {
        fileEntry.createWriter(function (fileWriter) {

            fileWriter.onwriteend = function() {
                // ons.notification.alert({title:"Внимание", messageHTML:'<p class="notification-alert">Файл успешно сохранён: ' + fileEntry.name + '</p>'})
            };

            fileWriter.onerror = function (e) {
                console.log("Failed file write: " + e.toString());
            };

            fileWriter.write(dataObj);
        });
    }
}

function showAllFilesAtDir(pathToDir, succes){
    window.resolveLocalFileSystemURL(pathToDir, function(dirEntry){
        let directoryReader = dirEntry.createReader();
        directoryReader.readEntries(succes, function(error){
            console.log('Unable to read directory')
        })
    })
}

function openFileFromProject(relativePath,  callback, firstCheckApplicationDirectory = true){
    let firstDirectory = root_directory + relativePath;
    let secondDirectory = cordova.file.applicationDirectory + 'www/resources/Project/';
    if(firstCheckApplicationDirectory){
        firstDirectory = cordova.file.applicationDirectory + 'www/resources/Project/';
        secondDirectory = root_directory + relativePath;
    }
    window.resolveLocalFileSystemURL(firstDirectory + relativePath, readFile, function(error){
        if(checkApplicationDirectory){
            window.resolveLocalFileSystemURL(secondDirectory + relativePath, readFile, onError); 
        }
        else{
            onError(error);
        }
    });

    function readFile(file){
        file.file(function (file) {
            var reader = new FileReader();
            reader.onloadend = function(evt){
                callback(this.result, file.name);
            }
            reader.readAsText(file, 'utf-8');
        });
    }

    function onError(error){
        console.log("Error while open file:", relativePath);
        ons.notification.alert({
            title:"Внимание", 
            messageHTML:`<p class="notification-alert">Ошибка при открытии файла: ${relativePath} </p>`
        });
    }
}

function tileLoadFunctionLocal(imageTile, src){
    window.resolveLocalFileSystemURL(src, function success(fileEntry){
        imageTile.getImage().src = fileEntry.toInternalURL();
    }, function(error){
        window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + 'www/resources/images/empty_tile.png', function(fileEntry){
            imageTile.getImage().src = fileEntry.toInternalURL();
            }, function(error){
                console.log("Tile wasn't found")
            }
        );
    });
}

function tileLoadFunctionDefault(imageTile, src){
    imageTile.getImage().src = src;
}

function rosreetrUrlFunction(tileCoord, number, projection){
    const maxY = 2**tileCoord[0];
    const tile = [tileCoord[1], tileCoord[2], tileCoord[0]];
    const bbox = tileToBBOX(tile);
    const bboxM = ol.proj.transformExtent(bbox, 'EPSG:4326', projection);
    return rosreestr_url + '&bbox=' + bboxM.join(','); 
}

function globalReadlFile(fileUri, callback) {
    if (fileUri.startsWith('content://')) {
        cordova.plugins.safMediastore.readFile(fileUri).then(data => {
            const decoder = new TextDecoder('utf-8'); 
            const text = decoder.decode(data);
            callback(text);
          }, onError);
      } else {
        window.resolveLocalFileSystemURL(fileUri, function (fileEntry) {
            fileEntry.file(function (file) {
                var reader = new FileReader();
    
                reader.onloadend = function (e) {
                    callback(this.result); 
                };
    
                reader.onerror = function () {
                    console.error('Ошибка чтения файла:', this.error);
                };
    
                reader.readAsText(file, 'UTF-8');
            }, onError);
        }, onError);
      }

    function onError(error) {
        console.error("Ошибка: " + JSON.stringify(error));
    }
}