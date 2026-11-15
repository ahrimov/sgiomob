function openFile(path, post_processing){
    window.resolveLocalFileSystemURL(path, function(fileEntry) {
        console.log(path);
        console.log(fileEntry);
        console.log(fileEntry.isFile);
        fileEntry.file(function (file) {
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

async function getSavedFileMessageHTML(fileUri) {
    const externalStorageMatch = /^content:\/\/com\.android\.externalstorage\.documents\/document\/([^?#]+)/.exec(fileUri);
    const downloadsMatch = /^content:\/\/com\.android\.providers?\.downloads\.documents\/document\/([^?#]+)/.exec(fileUri);
    const externalRoot = cordova.file && cordova.file.externalRootDirectory;
    const storagePath = externalRoot ? decodeURIComponent(new URL(externalRoot).pathname).replace(/\/$/, '') : null;
    let location = fileUri;

    if (externalStorageMatch) {
        const documentId = decodeURIComponent(externalStorageMatch[1]);
        if (storagePath && documentId.startsWith('primary:')) {
            location = `${storagePath}/${documentId.slice('primary:'.length)}`;
        }
    }

    if (downloadsMatch) {
        const documentId = decodeURIComponent(downloadsMatch[1]);
        if (documentId.startsWith('raw:')) {
            location = documentId.slice('raw:'.length);
        } else if (storagePath && /^\d+$/.test(documentId)) {
            const fileName = await cordova.plugins.safMediastore.getFileName(fileUri)
                .catch(() => null);
            if (fileName) {
                location = `${storagePath}/Download/${fileName}`;
            }
        }
    }

    const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
    return `Файл успешно сохранен:<br>${escapeHTML(location)}`;
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

// Keep viewed online tiles in the same folders used by the local layer mode.
function createCachedTileLoadFunction(localPathTemplate, tileGrid){
    return function(imageTile, src){
        if (!localPathTemplate || typeof FileTransfer === 'undefined' ||
            typeof window.resolveLocalFileSystemURL !== 'function') {
            tileLoadFunctionDefault(imageTile, src);
            return;
        }

        const coord = imageTile.getTileCoord();
        if (!coord) {
            tileLoadFunctionDefault(imageTile, src);
            return;
        }

        const [z, x, y] = coord;
        const fullRange = tileGrid.getFullTileRange(z);
        const invertedY = fullRange ? fullRange.getHeight() - y - 1 : 2 ** z - y - 1;
        const relativePath = localPathTemplate.replace(/\{(-?y|z|x)\}/g, (match, key) => ({
            z, x, y, '-y': invertedY
        })[key]);
        const mediaPrefix = 'Android/media/' + app_directory_name + '/';
        if (!relativePath.startsWith(mediaPrefix) || relativePath.includes('..')) {
            tileLoadFunctionDefault(imageTile, src);
            return;
        }

        const tilePath = relativePath.slice(mediaPrefix.length);
        const lastSlash = tilePath.lastIndexOf('/');
        const folders = tilePath.slice(0, lastSlash).split('/');
        const filename = tilePath.slice(lastSlash + 1);
        const cachedUrl = main_directory + relativePath;

        window.resolveLocalFileSystemURL(cachedUrl, function(fileEntry){
            fileEntry.file(function(file){
                if (file.size > 0) {
                    imageTile.getImage().src = fileEntry.toInternalURL();
                } else {
                    downloadTile();
                }
            }, downloadTile);
        }, downloadTile);

        function downloadTile(){
            window.resolveLocalFileSystemURL(common_media_directory, function(mediaEntry){
                mediaEntry.getDirectory(app_directory_name, {create: true}, function(appEntry){
                    createFolders(appEntry, folders, function(dirEntry){
                        dirEntry.getFile(filename, {create: true}, function(fileEntry){
                            const transfer = new FileTransfer();
                            transfer.download(encodeURI(src), fileEntry.nativeURL, function(savedEntry){
                                imageTile.getImage().src = savedEntry.toInternalURL();
                            }, function(error){
                                fileEntry.remove(function(){}, function(){});
                                console.warn('Tile cache download failed', error);
                                tileLoadFunctionDefault(imageTile, src);
                            }, false, {
                                headers: {'User-Agent': 'SGIOMOB/' + appVersion + ' (support@corelight.ru)'}
                            });
                        }, fallback);
                    }, fallback);
                }, fallback);
            }, fallback);
        }

        function fallback(error){
            console.warn('Tile cache unavailable', error);
            tileLoadFunctionDefault(imageTile, src);
        }
    };
}

function createFolders(parent, folders, success, fail){
    if (!folders.length) {
        success(parent);
        return;
    }
    parent.getDirectory(folders[0], {create: true}, function(next){
        createFolders(next, folders.slice(1), success, fail);
    }, fail);
}

function rosreetrUrlFunction(tileCoord, number, projection){
    const maxY = 2**tileCoord[0];
    const tile = [tileCoord[1], tileCoord[2], tileCoord[0]];
    const bbox = tileToBBOX(tile);
    const bboxM = ol.proj.transformExtent(bbox, 'EPSG:4326', projection);
    return rosreestr_url + '&bbox=' + bboxM.join(','); 
}

function globalReadlFile(fileUri, callback, onReadError) {
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
                    if (onReadError) onReadError(this.error);
                };
    
                reader.readAsText(file, 'UTF-8');
            }, onError);
        }, onError);
      }

    function onError(error) {
        console.error("Ошибка: " + JSON.stringify(error));
        if (onReadError) onReadError(error);
    }
}
