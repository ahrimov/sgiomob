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

function exportKML(layerID){
    window.resolveLocalFileSystemURL(root_directory, function(rootDirEntry){
        rootDirEntry.getDirectory("outputs", {create: true}, function(mainDirEntry){
            console.log("Create folder outputs")
        }, function(error){
            console.log("Erro while create folder")
        })
    }, function(error){
        console.log("Error with access")
    })
}
