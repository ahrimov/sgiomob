async function saveKMLToFile(layerId) {
    const layer = findLayer(layerId);

    const showSaveSuccess = newFileUri => {
        console.log('Успешное сохранение файла: ', newFileUri);
        ons.notification.alert({
            title: 'Успех',
            message: 'Файл успешно сохранён: ' + newFileUri,
            buttonLabels: ['ОК'],
        });
    };

    if (layer.getSource().getFeatures().length === 0){
        const userAnswer = await ons.notification.confirm({
            title: 'Сохранение KML-слоя',
            message: 'Экспортируемый слой не содержит объектов(узлов). Все равно сформировать KML-файл?',
            buttonLabels: ["Да", "Нет"],
        });
        if (userAnswer) return;
    }

    const kmlType = layer.get('kmlType');
    if (kmlType) {
        const fileUri = layer.get('fileUri');

        globalReadlFile(fileUri, (KMLContent) => {
            cordova.plugins.safMediastore.saveFile({ 
                data: toBase64(KMLContent),
                filename: layerId,
                folder: 'Documents',
            }).then(showSaveSuccess).catch(e => {
                ons.notification.alert({ 
                    title: 'Внимание',
                    message: 'Не удалось сохранить слой: ' + layerId,
                });
            })
        });
    } else {
        const format = new ol.format.KML();
        const kmlContent = format.writeFeatures(layer.getSource().getFeatures());

        cordova.plugins.safMediastore.saveFile({ 
            data: toBase64(kmlContent),
            filename: layerId,
            folder: 'Documents',
        }).then(showSaveSuccess).catch(e => {
            ons.notification.alert({ 
                title: 'Внимание',
                message: 'Не удалось сохранить слой: ' + layerId,
            });
        })
    }
}
