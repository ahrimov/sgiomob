function openDB(filename, name){
    db = window.sqlitePlugin.openDatabase({
        path: cordova.file.applicationStorageDirectory + "app_database/" + filename,
        name: name
      })
}

function initialDB(sourceFileName, dbName, name) {

    //var sourceFileName = root_directory + "Project/" + dbName;
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
                    openDB(dbName, name)
                })
            })
        }).catch(function () {
            console.log("file doesn't exist, copying it");
            return new Promise(function (resolve, reject) {
                sourceFile.copyTo(targetDir, dbName, resolve, reject);
            }).then(function () {
                console.log("database file copied");
                openDB(dbName, name)
            });
        });
    });
}


function getDataLayerFromBD(layer){
    if(typeof db === 'undefined'){
        setTimeout(getDataLayerFromBD, 50, layer)
        return
    }
    var source = new ol.source.Vector()
    const query =  `SELECT ${layer.atribs[0].name} as id, AsText(Geometry) as geom from ` + layer.id
        var querySuccess = function (tx, res) {
            const format = new ol.format.WKT();
            for (let i = 0; i < res.rows.length; i++) {
                var wkt = res.rows.item(i).geom
                var feature = format.readFeature(wkt.replace(/nan/g, "0"))
                feature.id = res.rows.item(i).id
                source.addFeature(feature)
                features.push(feature)
            }
            layer.setSource(source)
        }
        var queryError = function (err) {
            console.log("Error with database transaction")
            console.log("Query:", query)
        }
        db.transaction(function (tx) {
            tx.executeSql(query, [], querySuccess, queryError);
        })
}

function getDataFromDB(query, callback){
    if(typeof db === 'undefined'){
        setTimeout(getDataFromDB, 50, query, callback)
        return
    }
    var querySuccess = function(tx, res){
        callback(res)
    }
    var queryError = function(err){
        console.log("Error with database transaction")
        console.log("Query:", query)
    }
    db.transaction(function (tx) {
        tx.executeSql(query, [], querySuccess, queryError);
    })
}

