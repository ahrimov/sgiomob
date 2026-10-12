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
                    if(typeof defaultShowFeatureList !== 'undefined')
                        defaultShowFeatureList();
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
    const source = new ol.source.Vector();
    let selectTypeQuery = '';
    let selectLabelQuery = '';

    const atribType = layer.atribs.filter((atrib) => atrib.name === layer.styleTypeColumn);
    if(atribType.length > 0){
        selectTypeQuery = ` ${layer.styleTypeColumn} as type, `;
    }

    const atribDescription = layer.atribs.filter((atrib) => atrib.name === layer.labelColumn);
    if(atribDescription.length > 0){
        selectLabelQuery = ` ${layer.labelColumn} as description, `;
    }

    const query = `SELECT ${layer.atribs[0].name} as id,${selectTypeQuery} ${selectLabelQuery} AsText(Geometry) as geom from ` + layer.id;
    const finishWithEmptySource = function () {
        layer.setSource(source);
        completeLoad();
    };

    const createLayerTable = function (tx) {
        const quoteIdentifier = function (identifier) {
            return `"${String(identifier).replace(/"/g, '""')}"`;
        };
        const columnType = function (atrib, index) {
            if(index === 0) return 'INTEGER PRIMARY KEY';
            if(atrib.type === 'DOUBLE') return 'REAL';
            if(atrib.type === 'BOOLEAN') return 'INTEGER';
            return 'TEXT';
        };
        const columns = layer.atribs.map(function (atrib, index) {
            return `${quoteIdentifier(atrib.name)} ${columnType(atrib, index)}`;
        });
        columns.push(`${quoteIdentifier('Geometry')} BLOB`);

        const createQuery = `CREATE TABLE IF NOT EXISTS ${quoteIdentifier(layer.id)} (${columns.join(', ')})`;
        tx.executeSql(
            createQuery,
            [],
            function () {
                console.info(`Database table for layer '${layer.id}' was created.`);
                finishWithEmptySource();
            },
            queryError
        );
    };

    try{
        var querySuccess = function (tx, res) {
            const format = new ol.format.WKT();
            
            for (let i = 0; i < res.rows.length; i++) {
                let wkt = res.rows.item(i).geom;
                let feature = new ol.Feature();
                if(typeof wkt !== 'undefined' && wkt !== '')
                    feature = format.readFeature(wkt.replace(/nan/g, "0"));
                feature.id = res.rows.item(i).id;
                feature.layerID = layer.id;
                feature.type = res.rows.item(i).type;
                feature.label = res.rows.item(i).description;
                source.addFeature(feature);
            }
            layer.setSource(source)
            completeLoad()
        }
        var queryError = function (tx, err) {
            const errorMessage = err?.message || String(err || '');
            console.warn("Error with database transaction:", errorMessage);
            console.warn("Query:", query);
            ons.notification.alert({title:"Внимание", message: 'Ошибка в базе данных.'});
            finishWithEmptySource();
            return false;
        }

        db.transaction(function (tx) {
            tx.executeSql(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
                [layer.id],
                function (tx, res) {
                    if (res.rows.length === 0) {
                        console.warn(`Database table for layer '${layer.id}' does not exist. Creating it.`);
                        createLayerTable(tx);
                        return;
                    }

                    tx.executeSql(query, [], querySuccess, queryError);
                },
                queryError
            );
        })
    }  catch(err){
        console.error("Error while loading layer from database:", err);
        ons.notification.alert({title:"Внимание", message: 'Ошибка в базе данных.'});
        finishWithEmptySource();
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
        console.log("Error with database transaction", err);
        console.log("Query:", query);
        if(typeof notification === 'function'){
            notification(err);
        }
        else{
            ons.notification.alert({title:"Внимание", message:notification});
        }
        return false;
    }
    db.transaction(function (tx) {
        tx.executeSql(query, [], querySuccess, queryError);
    })
}

