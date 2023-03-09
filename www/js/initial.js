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
    //createMediaDirectory();
    checkIfFileExists(path, fileExist, warning);


    function createMediaDirectory(){
        let dirName = common_media_directory;
        window.resolveLocalFileSystemURL(dirName, function(dirEntry){
            dirEntry.getDirectory(app_directory_name, {create: true}, function(appDirEntry){
                appDirEntry.getDirectory('KML', {create: true});
            });
        })
        window.resolveLocalFileSystemURL(root_directory, function(dirEntry){
            dirEntry.getDirectory('KML', {create: true}, function(){
            }, function(err){
                console.log(err)
            });
        }, function(err){
            console.log(err)
        })
    }

    function fileExist(file){
        console.log('Config file exist!');
        createMediaDirectory();
        updateConfigFile(file, () => {
            openFile(path, configParser);
        });
    }

    function updateConfigFile(file, callback){
        const path_resources_config = cordova.file.applicationDirectory + "www/resources/Project/config.xml";
        window.resolveLocalFileSystemURL(path_resources_config, function(resource_config){
            window.resolveLocalFileSystemURL(root_directory, function(root){
                file.remove(() => {
                    resource_config.copyTo(root, 'config.xml', function(){
                        callback();
                    }, function(){
                        ons.notification.alert({title:"Внимание", message:`Критическая ошибка. Не удалось обновить конфигурационный файл.`})
                    })
                }, function () { callback(); })
            }, function(){
                ons.notification.alert({title:"Внимание", message:`не удалось обновить конфигурационный файл.`})
                callback();
            })
        }, function (){
            callback();
        })
    }
    
    function warning(){
        let sourceName = cordova.file.applicationDirectory + 'www/resources/Project';
        console.log(sourceName);
        let targetDirName = parent_root_directory;
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
            createMediaDirectory();
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
