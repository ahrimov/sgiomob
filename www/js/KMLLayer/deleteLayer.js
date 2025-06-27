function deleteLayer(layerID) {
    const layer = findLayer(layerID);
    const fileUri = layer.get('fileUri');

    deleteFile(fileUri).then(() => {
        map.removeLayer(layer);

        layers = layers.filter(layer => layer.id !== layerID);

        updatingVectorList();
    }).catch(error => {
        console.log('Не удалось удалить файл: ' + layerID + ' ошибка: ' + error);
        ons.notification.alert({ title: 'Внимание', message: 'Не удалось удалить файл: ' + layerID });
    })
}

function deleteFile(filePath) {
    return new Promise((resolve, reject) => {
        window.resolveLocalFileSystemURL(filePath, (fileEntry) => {
            fileEntry.remove(
                () => resolve(), 
                (error) => reject(error) 
            );
        }, (error) => {
            reject(`Файл не найден: ${error.message}`);
        });
    });
}