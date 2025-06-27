function saveKMLToFile(layerId) {
    const layer = findLayer(layerId);
    const fileUri = layer.get('fileUri');

    globalReadlFile(fileUri, (KMLContent) => {
        cordova.plugins.safMediastore.saveFile({ 
            data: toBase64(KMLContent),
            filename: layerId,
            folder: 'Documents',
         }).then(newFileUri => {
            console.log('Успешное сохранение файла: ', newFileUri);
         }).catch(e => {
            ons.notification.alert({ 
                title: 'Внимание',
                message: 'Не удалось сохранить слой: ' + layerId,
            });
         })
    });
}