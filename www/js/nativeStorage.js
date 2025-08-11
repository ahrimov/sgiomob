function saveMapPosition() {
    let saveTimeout;
    function debouncedSave(map) {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => saveMapState(map), 1000); 
    }

    map.getView().on('change:center', function() {
        debouncedSave(map);
    });

    function saveMapState(map) {
        const mapView = map.getView();
        const mapSettings = { center: mapView.getCenter(), zoom: mapView.getZoom() }

        NativeStorage.setItem(
            "mapSettings",
            mapSettings,
            () => console.log("Данные сохранены!"),
            (error) => console.error("Ошибка сохранения:", error)
        );
    }
}

function loadMapPosition() {
    NativeStorage.getItem(
        "mapSettings",
        (data) => {
            map.getView().setCenter(data.center);
            map.getView().setZoom(data.zoom);
        },
        (error) => console.error("Ошибка загрузки:", error)
    );
}

function saveLayersVisibility() {
    const visibilityState = {};

    layers.forEach(layer => {
        visibilityState[layer.get('id')] = layer.getVisible();
    });

    NativeStorage.setItem(
        "layerVisibility",
        visibilityState,
        () => console.log("Видимость слоев сохранена"),
        (error) => console.error("Ошибка сохранения видимости слоев:", error)
    );
}

function loadLayersVisibility(showInList = false) {
    NativeStorage.getItem(
        "layerVisibility",
        (data) => {
            if (data && typeof data === 'object') {
                layers.forEach(layer => {
                    const layerId = layer.get('id');
                    if (layerId in data) {
                        const isVisible = data[layerId];
                        layer.setVisible(isVisible);
                        layer.visible = isVisible;

                        if (showInList) {
                            const element = document.querySelector(`[data-id="${layerId}"]`);
                            if (element) {
                                element.style.backgroundColor = isVisible ? 'rgb(99 156 249)' : '#FFFFFF';
                            }
                        }
                    }
                });
            }
        },
        (error) => console.error("Ошибка загрузки видимости слоев:", error)
    );
}

function saveLayersOrder(order) {
    NativeStorage.setItem(
        'layersOrder',
        order,
        () => console.log("Данные сохранены!"),
        (error) => console.error("Ошибка сохранения:", error)
    );
}

async function loadLayersOrder() {
  return new Promise((resolve, reject) => {
    NativeStorage.getItem(
        'layersOrder', 
        (order) => resolve(order),
        (error) => {
            if (error.code === 2) resolve([]);
            else reject(error);
        }
    );
  });
}

async function initLayerOrder() {
    const savedOrder = await loadLayersOrder();

    if (savedOrder && savedOrder.length > 0) {
        // Если есть сохраненный порядок - используем его
        layers.sort(function(a, b) {
            const aIndex = savedOrder.indexOf(a.get("id"));
            const bIndex = savedOrder.indexOf(b.get("id"));
            // Всегда сортируем от большего к меньшему (сверху-вниз)
            return bIndex - aIndex;
        });
    } else {
        // Если сохраненного порядка нет - сортируем по zIndex (сверху-вниз)
        layers.sort(function(a, b) {
            return b.getZIndex() - a.getZIndex();
        });
        
        // NEW: Сохраняем этот порядок как начальный
        const initialOrder = layers.map(layer => layer.get("id"));
        await saveLayersOrder(initialOrder);
    }
    
    // Обновляем z-index (сверху-вниз)
    let count = layers.length;
    for (let layer of layers) {
        layer.setZIndex(minZIndexForVectorLayers + count);
        count--;
    }
}