let networkTileOffline = false;

function initNetworkTileMode() {
    document.addEventListener('offline', syncNetworkTileMode, false);
    document.addEventListener('online', syncNetworkTileMode, false);
    document.addEventListener('resume', syncNetworkTileMode, false);
    syncNetworkTileMode();
}

function syncNetworkTileMode() {
    networkTileOffline = typeof Connection !== 'undefined' &&
        navigator.connection?.type === Connection.NONE;

    baseRasterLayers.forEach(layer => {
        const preferredLocal = layer.get('preferredUseLocalTiles');
        setBaseRasterLayerMode(layer, networkTileOffline || preferredLocal);
    });

    if (document.querySelector('#info-label')) updateInfo();
}

function setBaseRasterLayerMode(layer, useLocalTiles) {
    const localPath = layer.get('local_path');
    const shouldUseLocal = Boolean(useLocalTiles && localPath);
    if (layer.get('useLocalTiles') === shouldUseLocal) return;

    const source = layer.getSource();
    if (shouldUseLocal) {
        source.setTileLoadFunction(tileLoadFunctionLocal);
        source.setUrl(main_directory + localPath);
    } else if (layer.get('id') === 'Rosreestr') {
        source.setTileLoadFunction(tileLoadFunctionDefault);
        source.setTileUrlFunction(rosreetrUrlFunction);
    } else {
        source.setTileLoadFunction(createCachedTileLoadFunction(localPath, source.getTileGrid()));
        source.setUrl(layer.get('remote_url'));
    }

    layer.set('useLocalTiles', shouldUseLocal);
}
