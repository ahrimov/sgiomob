function openDB(filename, name, sourceDirName){
    db = window.sqlitePlugin.openDatabase({
        path: cordova.file.applicationStorageDirectory + "app_database/" + filename,
        name: name
      })
    db.filename = filename
    db.sourceDirName = sourceDirName
}

function initialDB(sourceDirName, dbName, name) {

    var sourceFileName = sourceDirName + dbName;
    var targetDirName = cordova.file.applicationStorageDirectory + "app_database/";

    return Promise.all([
        new Promise(function (resolve, reject) {
            resolveLocalFileSystemURL(sourceFileName, resolve, reject);
        }),
        new Promise(function (resolve, reject) {
            resolveLocalFileSystemURL(targetDirName, resolve, reject);
        })
    ]).then(function (files) {
        var sourceFile = files[0];
        var targetDir = files[1];
        return new Promise(function (resolve, reject) {
            targetDir.getFile(dbName, {}, resolve, reject);
        }).then(function (oldFile) {
            console.log("file already copied")
            return new Promise(function (resolve, reject) {
                oldFile.remove(resolve, reject)
            }).then(function () {
                console.log("Old database was removed")
                return new Promise(function (resolve, reject) {
                    sourceFile.copyTo(targetDir, dbName, resolve, reject);
                }).then(function () {
                    console.log("database file copied");
                    openDB(dbName, name, sourceDirName)
                })
            })
        }).catch(function () {
            console.log("file doesn't exist, copying it");
            return new Promise(function (resolve, reject) {
                sourceFile.copyTo(targetDir, dbName, resolve, reject);
            }).then(function () {
                console.log("database file copied");
                openDB(dbName, name, sourceDirName)
            });
        });
    });
}

function saveDB(){
    if(typeof db == 'undefined')
        return
    let dbName = db.filename
    let pathDirExternalDB = db.sourceDirName

    let pathInternalDB = cordova.file.applicationStorageDirectory + "app_database/" + dbName;
    //let pathExternalDB = pathDirExternalDB + dbName

    return Promise.all([
        new Promise(function (resolve, reject) {
            resolveLocalFileSystemURL(pathInternalDB, resolve, reject);
        }),
        new Promise(function (resolve, reject) {
            resolveLocalFileSystemURL(pathDirExternalDB, resolve, reject);
        })
    ]).then(function(files){
        let internalDB = files[0]
        let dirExternalDB = files[1]
        return new Promise(function(resolve, reject){
            dirExternalDB.getFile(dbName, {}, resolve, reject)
        }).then(function(externalDB){
            return new Promise(function(resolve, reject){
                externalDB.remove(resolve, reject)
            }).then(function() {
                return new Promise(function(resolve, reject){
                    internalDB.copyTo(dirExternalDB, dbName, resolve, reject)
                }).then(function(){
                    console.log('database save succesfully')
                })
            })
        })
    })
}


function getDataLayerFromBD(layer){
    if(typeof db === 'undefined'){
        setTimeout(getDataLayerFromBD, 50, layer)
        return
    }
    var source = new ol.source.Vector()
    const query =  `SELECT ${layer.atribs[0].name} as id, AsText(Geometry) as geom from ` + layer.id
    try{  
        var querySuccess = function (tx, res) {
            const format = new ol.format.WKT();
            for (let i = 0; i < res.rows.length; i++) {
                var wkt = res.rows.item(i).geom
                var feature = format.readFeature(wkt.replace(/nan/g, "0"))
                feature.id = res.rows.item(i).id
                feature.layerID = layer.id
                source.addFeature(feature)
            }
            layer.setSource(source)
            completeLoad()
        }
        var queryError = function (err) {
            console.log("Error with database transaction")
            console.log("Query:", query)
            ons.notification.alert({title:"Внимание", message: 'Ошибка в базе данных.'})
        }
        db.transaction(function (tx) {
            tx.executeSql(query, [], querySuccess, queryError);
        })
    }  catch(err){
        ons.notification.alert({title:"Внимание", message: 'Ошибка в базе данных.'});
        completeLoad();
    }
}

function requestToDB(query, callback, notification = 'Неизвестная ошибка'){
    if(typeof db === 'undefined'){
        setTimeout(requestToDB, 50, query, callback)
        return
    }
    var querySuccess = function(tx, res){
        callback(res)
    }
    var queryError = function(tx, err){
        //ons.notification.alert({title:"Внимание", message:notification})
        console.log("Error with database transaction", err);
        console.log("Query:", query);
        //throw notification;
    }
    db.transaction(function (tx) {
        tx.executeSql(query, [], querySuccess, queryError);
    })
}

