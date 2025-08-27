function initial() {

    document.addEventListener('prepush', function(e) {
        const navigator = document.querySelector('#myNavigator');
        if (!navigator) return;
        if (navigator._isRunning) {
            e.cancel();
            setTimeout(() => navigator.pushPage(e.promise), 200);
        }
    });

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

    const pathToVersionFile = app_device_directory + versionFileName;
    getFileEntry(pathToVersionFile, (fileEntry) => {
        fileEntry.file(function (file) {
            const reader = new FileReader();
            reader.onloadend = function(evt) {
                if (this.result === appVersion) {
                    updateAppMode = false;
                    continueInitial();
                } else {
                    updateAppMode = true;
                    writeFileText(fileEntry, appVersion, continueInitial, () => {
                        console.log('Aborting');
                    });
                }
            }
            reader.readAsText(file, 'utf-8');
        });
    }, () => {
        updateAppMode = true;
        const dataObj = new Blob([appVersion], { type: 'text/plain' });
        saveFile(app_device_directory, versionFileName, dataObj, continueInitial);
    });

    requestExternalStoragePermission();
    checkPermissions();
}

function continueInitial() {
    const pathToConfig = root_directory + "config.xml";
    createMediaDirectory();
    checkIfFileExists(pathToConfig, fileExist, warning);

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
        if (updateAppMode){
            updateConfigFile(file, () => {
                openFile(pathToConfig, configParser);
            });
        }
        else 
            openFile(pathToConfig, configParser);
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
            openFile(pathToConfig, configParser);
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

function completeLoad() {
    if (typeof completeLoad.counter === 'undefined') {
        completeLoad.counter = 0;
        completeLoad.navigationCalled = false;
    }

    if (typeof completeLoad.finishCounter === 'undefined') {
        completeLoad.finishCounter = 0;
    }
    
    completeLoad.counter++;
    const finishCounter = completeLoad.finishCounter;
    
    if (document.querySelector('#load_stage') && finishCounter) {
        document.querySelector('#load_stage').textContent = `${completeLoad.counter}/${finishCounter}`;
    }
    
    if (completeLoad.counter >= finishCounter && !completeLoad.navigationCalled) {
        completeLoad.navigationCalled = true;
        
        setTimeout(() => {
            try {
                loadLayersVisibility();
                initLayerOrder();
                loadMapPosition();
                const navigator = document.querySelector('#myNavigator');
                
                if (navigator && navigator.resetToPage) {
                    if (completeLoad.counter >= finishCounter && completeLoad.navigationCalled) {
                        navigator.resetToPage('./views/home.html')
                            .then(() => {
                                console.log('Navigation completed successfully');
                            })
                            .catch(e => {
                                console.error('Navigation error:', e);
                                completeLoad.navigationCalled = false;
                            });
                    }
                }
            } catch (error) {
                console.error('Error in completeLoad:', error);
                completeLoad.navigationCalled = false;
            }
        }, 1000);
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

function requestExternalStoragePermission() {
    const permissions = cordova.plugins.permissions;
    permissions.requestPermission(permissions.READ_EXTERNAL_STORAGE, success, error);
  
    function success() {
        hasExternalStoragePermissions = true;
        console.log('Доступ к внешнему хранилищу разрешён');
    }
  
    function error() {
        hasExternalStoragePermissions = false;
        console.log('Доступ к внешнему хранилищу запрещён');
    }
}

function checkPermissions() {
    if (cordova.plugins && cordova.plugins.permissions) {
        cordova.plugins.permissions.checkPermission(
            cordova.plugins.permissions.READ_EXTERNAL_STORAGE,
            function (result) {
                if (!result.hasPermission) {
                    cordova.plugins.permissions.requestPermission(
                        cordova.plugins.permissions.READ_EXTERNAL_STORAGE,
                        function (status) {
                            if (!status.hasPermission) {
                                alert('Необходимо предоставить доступ к файлам!');
                            }
                        }
                    );
                }
            }
        );
    }
}

function checkManageExternalStoragePermission() {
    if (device.platform === 'Android' && parseInt(device.version) >= 10) {
        cordova.plugins.permissions.checkPermission(
            cordova.plugins.permissions.MANAGE_EXTERNAL_STORAGE,
            function (result) {
                if (!result.hasPermission) {
                    cordova.plugins.permissions.requestPermission(
                        cordova.plugins.permissions.MANAGE_EXTERNAL_STORAGE,
                        function (status) {
                            if (!status.hasPermission) {
                                alert('Необходимо предоставить доступ к внешнему хранилищу!');
                            }
                        }
                    );
                }
            }
        );
    }
}
