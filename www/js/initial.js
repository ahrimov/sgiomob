function initial(){
    let path = root_directory + "Project/config.xml"
    checkIfFileExists(path, fileExist, warning)
    openFile(path, configParser)
}

function fileExist(){
    console.log('ok')
}

function warning(){
    ons.notification.alert(`Не найден файл io.cordova.sgiomob/Project/ config.xml.
    Пожалуйста, перенесите файлы проекта в папку Adnroid/data /io.cordova.sgiomob .`);
}
      
