function initial(){
    document.querySelector('#myNavigator').pushPage('./views/loadScreen.html');

    ons.ready(function(){
        ons.setDefaultDeviceBackButtonListener(function(event) {
            ons.notification.confirm({title: 'Потверждение выхода', message: 'Вы уверены, что хотите выйти?', buttonLabels: ["Нет", "Да"]}) 
            .then(function(index) {
                if (index === 1) { 
                navigator.app.exitApp(); 
                }
            });
        });
    })

    let path = root_directory + "config.xml";
    //openFile(path, configParser);
    createMediaDirectory();
    checkIfFileExists(path, fileExist, warning);


    function createMediaDirectory(){
        let dirName = "file:///storage/self/primary/Android/media/";
        window.resolveLocalFileSystemURI(dirName, function(dirEntry){
            dirEntry.getDirectory('io.cordova.sgiomob', {create: true}, function(appDirEntry){
                appDirEntry.getDirectory('KML', {create: true});
            });
        })
        window.resolveLocalFileSystemURI(root_directory, function(dirEntry){
            dirEntry.getDirectory('KML', {create: true});
        })
    }

    function fileExist(){
        console.log('Config file exist!');
        openFile(path, configParser);
    }
    
    function warning(){
        let sourceName = cordova.file.applicationDirectory + 'www/resources/Project';
        console.log(sourceName);
        let targetDirName = "file:///storage/self/primary/Android/data/io.cordova.sgiomob/";
        window.resolveLocalFileSystemURL(cordova.file.applicationDirectory,
            function(resourcesDir) {
                
                // get the directory we want to get within the root directory
                
                resourcesDir.getDirectory('www/resources/Project', {create: false}, getDirectoryWin, getDirectoryFail);
        });
    
        function getDirectoryWin(directory){
            console.log('got the directory');
    
            window.resolveLocalFileSystemURL(targetDirName,
                function(targetDir) {
                    
                    // get the directory we want to get within the root directory
                   
                    directory.copyTo(targetDir, "Project", copyWin, copyFail);
            });
        }
    
        function getDirectoryFail(){
            console.log("I failed at getting a directory");
        }
        
        function copyWin(){
            console.log('Copying worked!');
            
                openFile(path, configParser);
        }
        
        function copyFail(){
            console.log('I failed copying');
        }
        /*
        ons.notification.alert({title:"Внимание", message:`Не найден файл io.cordova.sgiomob/Project/ config.xml.
        Пожалуйста, перенесите файлы проекта в папку Android/data /io.cordova.sgiomob .`});*/
    }

    
}





function completeLoad(){
    if(typeof completeLoad.counter == 'undefined'){
        completeLoad.counter = 0
    }
    completeLoad.counter++;
    document.querySelector('#load_stage').textContent = `${completeLoad.counter}/${layers.length}`;
    if(completeLoad.counter == layers.length){
        document.querySelector('#myNavigator').resetToPage('./views/home.html')
        
    }
}
