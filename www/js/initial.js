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
        let dirName = common_media_directory;
        window.resolveLocalFileSystemURI(dirName, function(dirEntry){
            dirEntry.getDirectory(app_directory_name, {create: true}, function(appDirEntry){
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
                resourcesDir.getDirectory('www/resources/Project', {create: false}, getDirectoryWin, getDirectoryFail);
        });
    
        function getDirectoryWin(directory){
            window.resolveLocalFileSystemURL(targetDirName,
                function(targetDir) {
                    directory.copyTo(targetDir, "Project", copyWin, copyFail);
            });
        }
    
        function getDirectoryFail(){
            ons.notification.alert({title:"Внимание", message:`Ошибка в файлах проекта`});
        }
        
        function copyWin(){
            openFile(path, configParser);
        }
        
        function copyFail(){
            ons.notification.alert({title:"Внимание", message:`Ошибка в файлах проекта`});
        }
        /*
        ons.notification.alert({title:"Внимание", message:`Не найден файл io.cordova.sgiomob/Project/ config.xml.
        Пожалуйста, перенесите файлы проекта в папку Android/data /io.cordova.sgiomob .`});*/
    }

    document.addEventListener('resume', function() {
        setTimeout(() => {
            transformUIToOrientation();
        }, 100);
      }) 
}





function completeLoad(){
    if(typeof completeLoad.counter == 'undefined'){
        completeLoad.counter = 0
    }
    completeLoad.counter++;
    document.querySelector('#load_stage').textContent = `${completeLoad.counter}/${layers.length}`;
    if(completeLoad.counter == layers.length){
        document.querySelector('#myNavigator').resetToPage('./views/home.html');
    }
}
