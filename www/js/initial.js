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
        window.resolveLocalFileSystemURL(dirName, function(dirEntry){
            dirEntry.getDirectory(app_directory_name, {create: true}, function(appDirEntry){
                appDirEntry.getDirectory('KML', {create: true});
            });
        })
        window.resolveLocalFileSystemURL(root_directory, function(dirEntry){
            dirEntry.getDirectory('KML', {create: true});
        })
    }

    function fileExist(file){
        console.log('Config file exist!');
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
        let targetDirName = app_device_directory ;
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

    myNavigator.addEventListener('prepop', function(event) {
      if (needsCancelNavigator) {
         event.cancel(); 
      } else {
        if(map.localMap){
            map.localMap = false;
            for(let layer of layers){
                const features  = layer.getSource().getFeatures();
                features.forEach((feature) => {
                    feature.changed();
                })
            }
        }
      }
    });

    addCustomProjections();

    addHTMLToDocument('./views/modals/ManualInputCoordinatesDialog.html');
    addHTMLToDocument('./views/modals/ChooseEditGeometryMode.html');
}

function addCustomProjections(){
    proj4.defs('EPSG:3395', '+title=Yandex +proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
    ol.proj.proj4.register(proj4);    
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

function addHTMLToDocument(filename){
    fetch(filename)
     .then(response => {
        return response.text();
    })
     .then(data => {
        document.querySelector('#modalWindowTemplates').innerHTML += data;
     });
}