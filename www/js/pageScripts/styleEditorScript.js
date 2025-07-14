function styleEditor(layer, callback) {
    const geometryType = layer.geometryType;
    const styleSettings = layer.styleSettings;

    const previewFeature = createPreviewFeature(geometryType);

    layer.getSource().addFeature(previewFeature);

    const previewMap = new ol.Map({
        target: 'style-preview-map',
        controls: [],
        interactions: [],
        layers: [layer],
    });

    previewMap.getView().fit(previewFeature.getGeometry().getExtent());

    const defaultStyle = getDefaultStyleFromLayer(layer);

    const styleUpdater = (() => {
        let currentStyle = new ol.style.Style();
        let currentImage = defaultStyle.getImage();
        currentStyle.setImage(currentImage);
        let currentShape = styleSettings?.shape || 'circle';
        let currentBorderColor = '#000000';

        return {
            updateShape(shape) {
                if (shape === 'circle' && currentImage instanceof ol.style.Circle) return;

                if (shape === 'circle') {
                    currentImage = new ol.style.Circle({
                        radius: currentImage.getRadius(),
                        fill: currentImage.getFill(),
                        stroke: currentImage.getStroke()
                    });
                } else if (shape === 'square') {
                    currentImage = new ol.style.RegularShape({
                        points: 4,
                        radius: currentImage.getRadius(),
                        angle: Math.PI / 4,
                        fill: currentImage.getFill(),
                        stroke: currentImage.getStroke()
                    });
                } else if (shape === 'triangle') {
                    currentImage = new ol.style.RegularShape({
                        points: 3,
                        radius: currentImage.getRadius(),
                        angle: 0,
                        fill: currentImage.getFill(),
                        stroke: currentImage.getStroke()
                    });
                }

                currentStyle.setImage(currentImage);
                previewFeature.setStyle(currentStyle);
                currentShape = shape;
            },

            updateSize(size) {
                if (currentShape === 'circle') {
                    currentImage.setRadius(size);
                } else {
                    if (currentShape === 'square') {
                        currentImage = new ol.style.RegularShape({
                            points: 4,
                            radius: size,
                            angle: Math.PI / 4,
                            fill: currentImage.getFill(),
                            stroke: currentImage.getStroke()
                        });
                    } else if (currentShape === 'triangle') {
                        currentImage = new ol.style.RegularShape({
                            points: 3,
                            radius: size,
                            angle: 0,
                            fill: currentImage.getFill(),
                            stroke: currentImage.getStroke()
                        });
                    }
                    currentStyle.setImage(currentImage);
                }
                previewFeature.setStyle(currentStyle);
            },

            updateColor(color) {
                currentImage.getFill().setColor(color);
                previewFeature.setStyle(currentStyle);
            },

            updateBorderColor(color) {
                let stroke = currentImage.getStroke();
                if (stroke) {
                    stroke.setColor(color);
                    currentImage.setStroke(stroke);
                }
                currentBorderColor = color;
                currentStyle.setImage(currentImage);
                previewFeature.setStyle(currentStyle);
            },

            updateBorderSize(width) {
                let stroke = currentImage.getStroke();
                if (stroke) {
                    stroke.setWidth(width);
                } else {
                    stroke = new ol.style.Stroke({ width, color: currentBorderColor });
                }
                if (width) {
                    currentImage.setStroke(stroke);
                } else {
                    currentImage.setStroke(null);
                }
                currentStyle.setImage(currentImage);
                previewFeature.setStyle(currentStyle);
            }
        };
    })();

    switch (geometryType) {
        case 'Point':
         case 'MultiPoint':
            createPointEditor();
            break;
        default:
            break;
    }

    setTimeout(() => {
        applyDefaultStyleValues(defaultStyle);

        const selectElement = document.getElementById('style-select-shape');
        const event = new Event('change', { bubbles: true });
        selectElement.dispatchEvent(event);

        document.getElementById('style-select-shape')?.addEventListener('change', (e) => {
            styleUpdater.updateShape(e.target.value);
        });

        document.getElementById('style-input-size')?.addEventListener('change', (e) => {
            styleUpdater.updateSize(parseInt(e.target.value) ?? 10);
        });

        document.getElementById('color-input')?.addEventListener('change', (e) => {
            styleUpdater.updateColor(e.target.value);
        });

        document.getElementById('style-input-border')?.addEventListener('change', (e) => {
            styleUpdater.updateBorderSize(parseInt(e.target.value) ?? 0);
        });

        document.getElementById('border-color-input')?.addEventListener('change', (e) => {
            styleUpdater.updateBorderColor(e.target.value);
        });

        const saveButton = document.getElementById('saveLayerStyle');
        saveButton.addEventListener('click', () => savePointStyle(layer, geometryType, callback));

        const cancelButton = document.getElementById('backButtonStyleEditor');
        cancelButton.addEventListener('click', () => closeStylePage(callback));
    }, 0);


    function savePointStyle(layer, geometryType, callback) {
        let style;
        let styleSettings;
        switch (geometryType) {
            case 'Point':
            case 'MultiPoint':
                style = previewFeature.getStyle();
                styleSettings = getPointStyleSettings();
                break;
        }

        const features = layer.getSource().getFeatures();
        if (features.length > 0) {
            features.forEach(feature => {
                feature.setStyle(style);
            });
        }

        layer.setStyle(style);

        layer.styleSettings = styleSettings;
        
        layer.getSource().changed();

        handleStyleUpdate(layer);

        closeStylePage(callback);
    }

    function closeStylePage(callback) {
        layer.getSource().removeFeature(previewFeature);

        const navigator = document.querySelector('#myNavigator');
        navigator.popPage({ times: 1 });
        callback?.();
    }
}

function getDefaultStyleFromLayer(layer) {
    const features = layer.getSource().getFeatures();
    if (features.length > 0) {
        const feature = features[0];
        return feature.getStyle() || layer.getStyle() || createDefaultPointStyle();
    }
    return createDefaultPointStyle();
}

function createDefaultPointStyle() {
    return new ol.style.Style({
        image: new ol.style.Circle({
            radius: 10,
            fill: new ol.style.Fill({
                color: '#3399CC'
            }),
            stroke: new ol.style.Stroke({
                color: '#FFFFFF',
                width: 2
            })
        })
    });
}

function applyDefaultStyleValues(style) {
    if (!style) return;

    const image = style.getImage();
    if (!image) return;

    let shapeType = 'circle';
    if (image instanceof ol.style.RegularShape) {
        if (image.getPoints() === 3) shapeType = 'triangle';
        else if (image.getPoints() === 4) shapeType = 'square';
    }

    const shapeSelect = document.getElementById('style-select-shape');
    if (shapeSelect) shapeSelect.value = shapeType;

    const sizeInput = document.getElementById('style-input-size');
    if (sizeInput) {
        sizeInput.value = image.getRadius() || 10;
        const event = new Event('change', { bubbles: true });
        sizeInput.dispatchEvent(event);
    }

    const colorInput = document.getElementById('color-input');
    if (colorInput && image.getFill()) {
        const fillColor = olColorToHex(image.getFill().getColor());
        colorInput.value = fillColor;
    }

    const borderSizeInput = document.getElementById('style-input-border');
    if (borderSizeInput && image.getStroke()) {
        borderSizeInput.value = image.getStroke().getWidth() || 2;
    }
    if (borderSizeInput) {
        const event = new Event('change', { bubbles: true });
        borderSizeInput.dispatchEvent(event);
    }

    const borderColorInput = document.getElementById('border-color-input');
    if (borderColorInput && image.getStroke()) {
        const strokeColor = olColorToHex(image.getStroke().getColor()) || '#000000';
        borderColorInput.value = strokeColor;
    } else if (borderColorInput) {
        borderColorInput.value = '#000000';
    }

    const preview = document.getElementById('point-color-preview');
    if (preview && image.getFill()) {
        preview.setAttribute('fill', image.getFill().getColor() || '#000000');
    }

    const previewBorder = document.getElementById('point-border-color-preview');
    if (previewBorder && image.getStroke()) {
        previewBorder.setAttribute('fill', image.getStroke().getColor() || '#000000');
    }
}

function handleClickStyleShape(_) {
    const dict = { 'circle': 'Круг', 'square': 'Квадрат', 'triangle': 'Треугольник' };
    const selected = document.getElementById('style-select-shape').value;
    createModalSelect(dict, 'style-select-shape', selected, false);
}

function handleEditStyleShape(event) {
    const shapes = {
        triangle: '<polygon points="100,20 180,180 20,180" fill="#000000"/>',
        circle: '<circle cx="100" cy="100" r="80" fill="#000000"/>',
        square: '<rect x="30" y="30" width="140" height="140" fill="#000000"/>'
    };

    const value = event.target.value;
    const icon = document.getElementById('style-select-icon');

    icon.innerHTML = shapes[value];
}

function createPreviewFeature(geometryType) {
    switch (geometryType) {
        case 'Point':
        case 'MultiPoint':
            return new ol.Feature({
                geometry: new ol.geom.Point([0, 0]),
            });
        case 'LineString':
        case 'MultiLineString':
            return new ol.Feature({
                geometry: new ol.geom.LineString([[-1, 0], [1, 0]]),
            });
        case 'Polygon':
        case 'MultiPolygon':
            return new ol.Feature({
                geometry: new ol.geom.Polygon([[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]),
            });
    }
}

function createPointEditor() {
    const template = document.querySelector('#point-editor');
    const cloneNode = template.content.cloneNode(true);
    document.querySelector('#style-editor-content').appendChild(cloneNode);
}

function decrementInput(inputId, min = 0) {
    const input = document.getElementById(inputId);
    const value = parseInt(input.value);
    if (value > min) {
        input.value = value - 1;
        const event = new Event('change', { 'bubbles': true });
        input.dispatchEvent(event);
    }
}

function incrementInput(inputId, max = 100) {
    const input = document.getElementById(inputId);
    const value = parseInt(input.value);
    if (value < max) {
        input.value = value + 1;
        const event = new Event('change', { 'bubbles': true });
        input.dispatchEvent(event);
    }
}

function handleCustomInput(event, inputId, incrementControlId, decrementControlId, min = 0, max = 100) {
    const value = parseInt(event.target.value);

    if (value < min) {
        const input = document.getElementById(inputId);
        input.value = min;
    }

    if (value > max) {
        const input = document.getElementById(inputId);
        input.value = max;
    }

    const incrementControl = document.getElementById(incrementControlId);
    const decrementControl = document.getElementById(decrementControlId);

    if (value === min) {
        decrementControl.classList.add('disabled');
    } else if (decrementControl.classList.contains('disabled')) {
        decrementControl.classList.remove('disabled');
    }

    if (value === max) {
        incrementControl.classList.add('disabled');
    } else if (incrementControl.classList.contains('disabled')) {
        incrementControl.classList.remove('disabled');
    }
}

function handleColorInput(event, colorInputId, previewId) {
    event.preventDefault();
    const input = document.getElementById(colorInputId);
    const color = input.value || '#000000';

    cordova.plugins.colorPicker.showDialog({ 
        color,
    }, (result) => {
        input.value = result.color;
        const preview = document.getElementById(previewId);
        preview.setAttribute('fill', result.color);

        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
    }, (error) => {
        console.log(`Something went wrong: ${error}`);
    });
}

function getPointStyleSettings() {
    const shape = document.getElementById('style-select-shape')?.value;
    const size = document.getElementById('style-input-size')?.value;
    const color = document.getElementById('color-input')?.value;
    const borderSize = document.getElementById('style-input-border')?.value;
    const borderColor = document.getElementById('border-color-input')?.value;

    return { shape, size, color, borderSize, borderColor };
}

function createNewStyle() {
    const { shape, size, color, borderSize, borderColor } = getPointStyleSettings();

    let imageStyle;
    if (shape === 'circle') {
        imageStyle = new ol.style.Circle({
            radius: size,
            fill: new ol.style.Fill({ color }),
            stroke: new ol.style.Stroke({ color: borderColor, width: borderSize })
        });
    } else if (shape === 'square') {
        imageStyle = new ol.style.RegularShape({
            points: 4,
            radius: size,
            angle: Math.PI / 4,
            fill: new ol.style.Fill({ color }),
            stroke: new ol.style.Stroke({ color: borderColor, width: borderSize })
        });
    } else if (shape === 'triangle') {
        imageStyle = new ol.style.RegularShape({
            points: 3,
            radius: size,
            rotation: Math.PI / 4,
            angle: 0,
            fill: new ol.style.Fill({ color }),
            stroke: new ol.style.Stroke({ color: borderColor, width: borderSize })
        });
    }

    return new ol.style.Style({ image: imageStyle });
}

function updateExistingStyle(style) {
    const { shape, size, color, borderSize, borderColor } = getPointStyleSettings();

    const image = style.getImage();

    if (shape === 'circle' && image instanceof ol.style.Circle) {
        image.setRadius(size);
        image.getFill().setColor(color);
    } else if (shape === 'square' && image instanceof ol.style.RegularShape) {
        image.setRadius(size);
        image.setFill(new ol.style.Fill({ color }));
    } else if (shape === 'triangle' && image instanceof ol.style.RegularShape) {
        image.setRadius(size);
        image.setFill(new ol.style.Fill({ color }));
    } else {
        // Если тип фигуры изменился, создаём новое изображение
        const newImage = createImageForShape(shape, size, color, borderSize, borderColor);
        style.setImage(newImage);
    }
    if (borderSize) {
        image.setStroke(new ol.style.Stroke({ color: borderColor, width: borderSize }));
    }
}

function createImageForShape(shape, size, color, borderSize, borderColor) {
    if (shape === 'circle') {
        return new ol.style.Circle({
            radius: size,
            fill: new ol.style.Fill({ color }),
            stroke: new ol.style.Stroke({ color: borderColor, width: borderSize })
        });
    } else if (shape === 'square') {
        return new ol.style.RegularShape({
            points: 4,
            radius: size,
            angle: Math.PI / 4,
            fill: new ol.style.Fill({ color }),
            stroke: new ol.style.Stroke({ color: borderColor, width: borderSize })
        });
    } else if (shape === 'triangle') {
        return new ol.style.RegularShape({
            points: 3,
            radius: size,
            rotation: Math.PI / 4,
            angle: 0,
            fill: new ol.style.Fill({ color }),
            stroke: new ol.style.Stroke({ color: borderColor, width: borderSize })
        });
    }

    return null;
}

function olColorToHex(color) {
    if (!color) return '#000000';
    
    // Если цвет уже в HEX-формате
    if (typeof color === 'string' && color.startsWith('#')) {
        return color.length === 7 ? color : '#000000';
    }
    
    // Если цвет в формате rgba(r, g, b, a)
    if (typeof color === 'string' && color.startsWith('rgba(')) {
        const parts = color.match(/[\d.]+/g);
        if (parts && parts.length >= 3) {
            return rgbToHex(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
        }
    }
    
    // Если цвет как массив [r, g, b, a]
    if (Array.isArray(color)) {
        return rgbToHex(color[0], color[1], color[2]);
    }
    
    return '#000000';
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function showColorPicker(inputId, previewId) {
    const input = document.getElementById(inputId);
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = input.value || '#000000';
    
    colorInput.addEventListener('change', () => {
        input.value = colorInput.value;
        const preview = document.getElementById(previewId);
        if (preview) preview.setAttribute('fill', colorInput.value);
        
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
    });
    
    colorInput.click();
}