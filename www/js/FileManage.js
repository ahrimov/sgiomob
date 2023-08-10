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

function saveFile(pathDir, fileName, fileData){
    window.resolveLocalFileSystemURL(pathDir, function(dirEntry){
        dirEntry.getFile(fileName, {create: true}, function(fileEntry){
            writeFile(fileEntry,  fileData)
        }, function(error){
            ons.notification.alert({title:"Внимание", message:`Невозможно создать файл. Ошибка:` + error})
        })
    })
}

function writeFile(fileEntry, dataObj) {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function (fileWriter) {

        fileWriter.onwriteend = function() {
            //console.log("Successful file write...", fileEntry.toInternalURL());
            ons.notification.alert({title:"Внимание", messageHTML:'<p class="notification-alert">Файл успешно сохранён: ' + fileEntry.name + '</p>'})
        };

        fileWriter.onerror = function (e) {
            console.log("Failed file write: " + e.toString());
        };

        // If data object is not passed in,
        // create a new Blob instead.
        if (!dataObj) {
            dataObj = new Blob(['some file data'], { type: 'text/plain' });
        }

        fileWriter.write(dataObj);
    });
}


function showAllFilesAtDir(pathToDir, succes){
    window.resolveLocalFileSystemURL(pathToDir, function(dirEntry){
        let directoryReader = dirEntry.createReader();
        directoryReader.readEntries(succes, function(error){
            console.log('Unable to read directory')
        })
    })
}

function openFileFromProject(relativePath,  callback, checkApplicationDirectory = true){
    const applicationProjectDirectory = cordova.file.applicationDirectory + 'www/resources/Project/';
    window.resolveLocalFileSystemURL(applicationProjectDirectory + relativePath, readFile, function(error){
        if(checkApplicationDirectory){
            window.resolveLocalFileSystemURL(root_directory + relativePath, readFile, onError); 
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
