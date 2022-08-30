function openFile(path, post_processing){
    window.resolveLocalFileSystemURL(path, function(file) {
        file.file(function (file) {
            var reader = new FileReader();
            reader.onloadend = function(evt){
                post_processing(this.result)
            }
            reader.readAsText(file, 'utf-8');
        })
    }, function(error){
        console.log("Error while open file:", path)
    })
}

function getFileEntry(path, success, fail) {
    window.resolveLocalFileSystemURL(path, success, fail);
}

function createFolder(){
    window.resolveLocalFileSystemURL("file:///storage/self/primary", function(rootDirEntry){
        rootDirEntry.getDirectory("sgiomob", {create: true}, function(mainDirEntry){
            console.log("Create folder sgiomob is success")
        }, function(error){
            console.log("Error while create folder:" + error.message)
        })
    }, function(error){
        console.log("Error while get a folder sgiomob:" + error)
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
            ons.notification.alert(`Невозможно создать файл. Ошибка:`, error)
        })
    }, function (error){
        ons.notification.alert(`Невозможно открыть директорию. Ошибка:`, error)
    })
}


function writeFile(fileEntry, dataObj) {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function (fileWriter) {

        fileWriter.onwriteend = function() {
            //console.log("Successful file write...", fileEntry.toInternalURL());
            ons.notification.alert('Файл успешно сохранён: ' + fileEntry.name)
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
