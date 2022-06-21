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