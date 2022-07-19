function initial(){
    document.querySelector('#myNavigator').pushPage('./views/loadScreen.html');
    let path = root_directory + "Project/config.xml"
    checkIfFileExists(path, fileExist, warning)
    openFile(path, configParser)
    //showMap()
    turnGPS()
}

function fileExist(){
    console.log('ok')
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
        document.querySelector('#myNavigator').popPage()
    }
}
