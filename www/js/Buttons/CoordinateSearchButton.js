class CoordinateSearchButton extends ol.control.Control {
    constructor(options = {}) {
        const element = ons.createElement(`<div class="coordinate-search-button">
            <ons-fab class="map-control-fab" modifier="material mini" disable-auto-styling
                     aria-label="Переход по координатам WGS-84" title="Переход по координатам WGS-84">
                <img class="map-primary-action-icon" src="./resources/images/assets/showOnMap.png" alt="">
            </ons-fab>
        </div>`);
        super({ element, target: options.target });
        this.opening = false;
        element.addEventListener('click', () => this.openDialog());
    }

    async openDialog() {
        const targetMap = this.getMap();
        if (!targetMap || this.opening || document.getElementById('coordinate-search-dialog')) return;
        this.opening = true;
        try {
            const dialog = await ons.createElement('coordinate-search-template', { append: true });
            const form = dialog.querySelector('form');
            const view = targetMap.getView();
            const center = view.getCenter();
            if (center) {
                const lonLat = ol.proj.toLonLat(center, view.getProjection());
                form.elements.latitude.value = lonLat[1].toFixed(6);
                form.elements.longitude.value = lonLat[0].toFixed(6);
                const currentDistance = ol.proj.getPointResolution(
                    view.getProjection(), view.getResolution(), center, 'm'
                ) * (96 / 2.54);
                const scaleOptions = Array.from(form.elements.scale.options)
                    .filter(option => Number(option.value) > 0);
                if (Number.isFinite(currentDistance) && currentDistance > 0 && scaleOptions.length) {
                    const closest = scaleOptions.reduce((best, option) =>
                        Math.abs(Math.log(Number(option.value) / currentDistance)) <
                        Math.abs(Math.log(Number(best.value) / currentDistance)) ? option : best);
                    form.elements.scale.value = closest.value;
                }
            }
            const close = () => dialog.hide();
            dialog.addEventListener('posthide', () => dialog.remove(), { once: true });
            dialog.onDeviceBackButton = close;
            dialog.querySelector('.coordinate-search-close').addEventListener('click', close);
            form.querySelector('.coordinate-search-cancel').addEventListener('click', close);
            form.querySelectorAll('input[name="scaleMode"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    const custom = form.elements.scaleMode.value === 'custom';
                    form.elements.scale.disabled = custom;
                    form.elements.distance.disabled = !custom;
                });
            });
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const error = form.querySelector('.coordinate-search-error');
                error.hidden = true;
                try {
                    const coordinate = parseWGSCoordinateSearch(form.elements.latitude.value, form.elements.longitude.value);
                    const center = ol.proj.fromLonLat(coordinate, view.getProjection());
                    if (!center.every(Number.isFinite)) throw new Error('Не удалось преобразовать координаты.');
                    const distance = parseCoordinateSearchNumber(form.elements.scaleMode.value === 'custom'
                        ? form.elements.distance.value : form.elements.scale.value);
                    const zoom = coordinateSearchZoom(view, center, distance);
                    // Stop GPS recentering while keeping the location marker active.
                    if (navigationMode === NAVIGATION_MODE.HOLD_CENTER_MAP) {
                        navigationMode = NAVIGATION_MODE.TURN_NAVIGATION_ARROW;
                        window.removeEventListener('deviceorientationabsolute', getOrientation, true);
                        targetMap.getInteractions().forEach(interaction => interaction.setActive(true));
                        view.setRotation(0);
                    }
                    view.cancelAnimations();
                    view.animate({ center, zoom, duration: 300 });
                    document.activeElement?.blur();
                    close();
                } catch (e) {
                    error.textContent = e.message;
                    error.hidden = false;
                }
            });
            await dialog.show();
        } catch (e) {
            document.getElementById('coordinate-search-dialog')?.remove();
            ons.notification.alert({ title: 'Переход по координатам', message: 'Не удалось открыть окно.' });
            console.error(e);
        } finally {
            this.opening = false;
        }
    }
}

function parseCoordinateSearchNumber(value) {
    const normalized = String(value).trim().replace(',', '.');
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
}

function parseWGSCoordinateSearch(latitude, longitude) {
    const lat = parseCoordinateSearchNumber(latitude);
    const lon = parseCoordinateSearchNumber(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        throw new Error('Введите широту от −90 до 90° в десятичных градусах.');
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
        throw new Error('Введите долготу от −180 до 180° в десятичных градусах.');
    }
    if (Math.abs(lat) > 85.0511287798066) {
        throw new Error('Карта поддерживает широты от −85,051128 до 85,051128°.');
    }
    return [lon, lat];
}

// Adapted from desktop constructZoomFromDistance; distance is entered in meters.
function coordinateSearchZoom(view, center, distanceMeters) {
    if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
        throw new Error('Укажите положительное расстояние для масштаба в метрах.');
    }
    const metersPerUnit = ol.proj.getPointResolution(view.getProjection(), 1, center, 'm');
    const resolution = distanceMeters / (96 / 2.54) / metersPerUnit;
    const zoom = view.getZoomForResolution(resolution);
    if (!Number.isFinite(zoom)) throw new Error('Не удалось рассчитать масштаб.');
    if (zoom < view.getMinZoom() || zoom > view.getMaxZoom()) {
        throw new Error('Этот масштаб недоступен. Выберите другое расстояние.');
    }
    return zoom;
}
