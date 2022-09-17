function initial(){
    document.querySelector('#myNavigator').pushPage('./views/loadScreen.html');

    ons.ready(function(){
        ons.setDefaultDeviceBackButtonListener(function(event) {
            ons.notification.confirm({title: 'Потверждение выхода', message: 'Вы уверены, что хотите выйти?'}) 
            .then(function(index) {
                if (index === 1) { 
                navigator.app.exitApp(); 
                }
            });
        });
    })

    let path = root_directory + "config.xml"
    checkIfFileExists(path, fileExist, warning)
    openFile(path, configParser)

    
}

function fileExist(){
    console.log('Config file exist!')
}

function warning(){
    ons.notification.alert(`Не найден файл io.cordova.sgiomob/Project/ config.xml.
    Пожалуйста, перенесите файлы проекта в папку Adnroid/data /io.cordova.sgiomob .`);
}


function completeLoad(){
    if(typeof completeLoad.counter == 'undefined'){
        completeLoad.counter = 0
    }
    completeLoad.counter++
    if(completeLoad.counter == layers.length){
        document.querySelector('#myNavigator').resetToPage('./views/home.html')
        
    }
}
