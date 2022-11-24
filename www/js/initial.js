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

    let sourceName = cordova.file.applicationDirectory + 'www/resources/Project';
    let targetDirName = "file:///storage/self/primary/Android/data/io.cordova.sgiomob/";

    return Promise.all([
        new Promise(function (resolve, reject) {
            console.log('a')
            resolveLocalFileSystemURL(sourceName, resolve, reject);
        }),
        new Promise(function (resolve, reject) {
            console.log('b')
            resolveLocalFileSystemURL(targetDirName, resolve, reject);
        })
    ]).then(function(files){
        console.log('c')
        let source = files[0];
        let targetDir = files[1];
        return new Promise(function(resolve, reject){
            console.log('d')
            source.copyTo(targetDir, "Project", resolve, reject)
        }).then(function(){
            console.log('e')
            let path = root_directory + "config.xml";
            checkIfFileExists(path, fileExist, warning);
            openFile(path, configParser);
        })
    })
        

    /*console.log(cordova.file.applicationDirectory)

    checkIfFileExists(cordova.file.applicationDirectory + 'www/resources/Project/config.xml', function(){
        console.log('yes')
    }, console.log('non'));
    openFile(cordova.file.applicationDirectory + 'www/resources/Project/config.xml', function(data){
        ons.notification.alert(data);
    })

    let path = root_directory + "config.xml";
    checkIfFileExists(path, fileExist, warning);
    openFile(path, configParser);*/

    
}

function fileExist(){
    console.log('Config file exist!')
}

function warning(){
    ons.notification.alert({title:"Внимание", message:`Не найден файл io.cordova.sgiomob/Project/ config.xml.
    Пожалуйста, перенесите файлы проекта в папку Android/data /io.cordova.sgiomob .`});
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
