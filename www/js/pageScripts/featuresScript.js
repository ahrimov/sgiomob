
function featuresInit(layerID) {
    const layer = findLayer(layerID);
    const kmlType = layer.get('kmlType');
    let left_row, right_row;
    const limit = 50;
    let offset = 0;
    let hasMore = true;
    let loadingRows = false;
    let loadVersion = 0;
    let matchingFeatureCount = null;
    const filters = { left: '', right: '' };
    let allFeaturesSelected = false;
    const selectedFeatureIds = new Set();
    const excludedFeatureIds = new Set();
    let deletingFeatures = false;

    const actionsButton = document.getElementById('features-actions-button');
    let actionsMask;
    let actionsMenu;
    const closeActionsMenu = (immediate = false) => {
        if (!actionsMask) return;
        const mask = actionsMask;
        const menu = actionsMenu;
        actionsMask = null;
        actionsMenu = null;
        actionsButton.setAttribute('aria-expanded', 'false');
        mask.classList.remove('is-visible');
        menu.classList.remove('is-visible');
        const removeMenu = () => {
            mask.remove();
            menu.remove();
        };
        if (immediate) removeMenu();
        else setTimeout(removeMenu, 180);
    };
    actionsButton.addEventListener('click', () => {
        if (actionsMask) {
            closeActionsMenu();
            return;
        }

        actionsMask = document.createElement('div');
        actionsMask.className = 'features-actions-mask';
        actionsMask.addEventListener('click', () => closeActionsMenu());
        document.body.append(actionsMask);

        const menu = document.createElement('div');
        menu.id = 'features-actions-menu';
        menu.className = 'features-actions-menu';
        menu.setAttribute('role', 'menu');
        [
            {label: 'Показать на карте', icon: 'showOnMap.png', action: showSelectedFeaturesOnMap},
            {label: 'Удалить', icon: 'delete.png', action: confirmDeleteSelectedFeatures}
        ].forEach(({label, icon, action}) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'features-action';
            item.setAttribute('role', 'menuitem');
            const image = document.createElement('img');
            image.className = 'features-action-icon';
            image.src = `./resources/images/assets/${icon}`;
            image.alt = '';
            const text = document.createElement('span');
            text.textContent = label;
            item.append(image, text);
            item.addEventListener('click', () => {
                if (menu.classList.contains('is-action-pending')) return;
                menu.classList.add('is-action-pending');
                item.classList.add('is-pressed');
                setTimeout(() => {
                    closeActionsMenu();
                    if (action) setTimeout(action, 180);
                }, 110);
            });
            menu.append(item);
        });
        const buttonBounds = actionsButton.getBoundingClientRect();
        menu.style.top = `${buttonBounds.bottom + 4}px`;
        menu.style.right = `${Math.max(8, window.innerWidth - buttonBounds.right)}px`;
        document.body.append(menu);
        actionsMenu = menu;
        menu.getBoundingClientRect();
        actionsMask.classList.add('is-visible');
        menu.classList.add('is-visible');
        actionsButton.setAttribute('aria-expanded', 'true');
    });
    actionsButton.closest('ons-page').addEventListener('destroy', () => closeActionsMenu(true));

    const layerAtribs = layer.atribs.filter(atrib => atrib.name !== 'geometryType');

    const idIndex = layerAtribs.findIndex(atrib => atrib.name === 'ID');
    if (idIndex > 0) {
        const idAtrib = layerAtribs.splice(idIndex, 1)[0];
        layerAtribs.unshift(idAtrib);
    }

    let table = "<table class='features'>" +
        "<colgroup><col class='features-select-column'><col><col></colgroup>" +
        "<thead>" + 
            "<tr>" + 
                `<th class="features-select-cell">
                    <label class="features-checkbox-label">
                        <input id="features-select-all" type="checkbox" aria-label="Выбрать все объекты">
                        <span class="features-checkbox-visual" aria-hidden="true"></span>
                    </label>
                </th>` +
                `<th><div class="features-header">
                    <ons-select id="feat_left">
                        <select class="feat_left">`
                        for(atrib of layerAtribs){
                            table += `<option value="${atrib.name}">${atrib.label}</option>`
                        }
                    table += `</select>
                    </ons-select>
                    <button type="button" class="features-filter-button" data-side="left" aria-label="Фильтр левого столбца">
                        <ons-icon icon="md-search"></ons-icon>
                    </button>
                </div></th>` +
                `<th><div class="features-header">
                    <ons-select id="feat_right">
                        <select class='feat_right'>`
                        for(atrib of layerAtribs){
                            table += `<option value="${atrib.name}">${atrib.label}</option>`
                        }
                    table += `</select>
                    </ons-select>
                    <button type="button" class="features-filter-button" data-side="right" aria-label="Фильтр правого столбца">
                        <ons-icon icon="md-search"></ons-icon>
                    </button>
                </div></th>` +
            "</tr>" +
        "</thead>" + 
        "<tbody id='features-tbody'>" +
        "</tbody>" + 
    "</table>"
    const content = document.getElementById("features-list");
    content.innerHTML = table;
    const countLabel = document.getElementById('features-count');
    if (kmlType) {
        countLabel.textContent = `Объектов в слое: ${layer.getSource().getFeatures().length}`;
    } else {
        requestToDB(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(layerID)}`, data => {
            countLabel.textContent = `Объектов в слое: ${data.rows.item(0).count}`;
        }, error => {
            countLabel.textContent = 'Объектов в слое: —';
            console.error('Feature count query failed:', error);
        });
    }
    const selectAllCheckbox = content.querySelector('#features-select-all');
    selectAllCheckbox.addEventListener('change', () => {
        allFeaturesSelected = selectAllCheckbox.checked;
        selectedFeatureIds.clear();
        excludedFeatureIds.clear();
        content.querySelectorAll('.features-row-checkbox').forEach(checkbox => {
            checkbox.checked = allFeaturesSelected;
        });
        updateSelectionHeader();
    });
    content.querySelectorAll('.features-filter-button').forEach(button => {
        button.addEventListener('click', () => showDialogSearch(button.dataset.side));
    });

    setTimeout(() => {
        const leftSelect = content.querySelector('#feat_left');
        const rightSelect = content.querySelector('#feat_right');

        leftSelect.addEventListener('change', editFeaturesTable);
        rightSelect.addEventListener('change', editFeaturesTable);
    })

    document.getElementById("title").innerHTML = layer.label
    left_row = layerAtribs[0].name
    right_row = layerAtribs[1].name
    document.getElementsByClassName("feat_right")[0].value = right_row
    const scrollArea = content;
    const scrollbar = content.parentElement.querySelector('.features-scrollbar');
    const thumb = scrollbar.querySelector('.features-scrollbar-thumb');
    scrollArea.addEventListener('scroll', () => {
        updateScrollbar();
        checkPosition();
    }, { passive: true });
    scrollbar.addEventListener('pointerdown', event => {
        event.preventDefault();
        scrollbar.setPointerCapture(event.pointerId);
        scrollToPointer(event);
    });
    scrollbar.addEventListener('pointermove', event => {
        if (scrollbar.hasPointerCapture(event.pointerId)) scrollToPointer(event);
    });
    window.addEventListener('resize', updateScrollbar);
    actionsButton.closest('ons-page').addEventListener('show', () => requestAnimationFrame(updateScrollbar));
    actionsButton.closest('ons-page').addEventListener('destroy', () => window.removeEventListener('resize', updateScrollbar));
    updateFilterButtons();
    updateMatchingFeatureCount();
    showFeaturesList();

    function updateScrollbar(){
        const maxScroll = Math.max(0, scrollArea.scrollHeight - scrollArea.clientHeight);
        scrollbar.hidden = maxScroll === 0;
        if (!maxScroll) return;
        const trackHeight = scrollbar.clientHeight;
        if (!trackHeight) return;
        const thumbHeight = Math.min(trackHeight, Math.max(24, trackHeight * scrollArea.clientHeight / scrollArea.scrollHeight));
        const thumbRange = trackHeight - thumbHeight;
        thumb.style.height = `${thumbHeight}px`;
        thumb.style.transform = `translateY(${scrollArea.scrollTop / maxScroll * thumbRange}px)`;
    }

    function scrollToPointer(event){
        const maxScroll = scrollArea.scrollHeight - scrollArea.clientHeight;
        const thumbRange = scrollbar.clientHeight - thumb.offsetHeight;
        if (maxScroll <= 0 || thumbRange <= 0) return;
        const top = event.clientY - scrollbar.getBoundingClientRect().top - thumb.offsetHeight / 2;
        scrollArea.scrollTop = Math.max(0, Math.min(thumbRange, top)) / thumbRange * maxScroll;
    }

    function updateListPosition(){
        requestAnimationFrame(() => {
            updateScrollbar();
            checkPosition();
        });
    }

    function defaultShowFeatureList(){
        resetFeaturesList();
    }

    function resetFeaturesList(){
        loadVersion++;
        offset = 0;
        hasMore = true;
        loadingRows = false;
        allFeaturesSelected = false;
        selectedFeatureIds.clear();
        excludedFeatureIds.clear();
        matchingFeatureCount = null;
        updateSelectionHeader();
        document.querySelector('#features-tbody').innerHTML = '';
        scrollArea.scrollTop = 0;
        updateFilterButtons();
        updateScrollbar();
        updateMatchingFeatureCount();
        showFeaturesList();
    }

    function updateFilterButtons(){
        content.querySelectorAll('.features-filter-button').forEach(button => {
            const active = filters[button.dataset.side].trim() !== '';
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    function updateSelectionHeader(){
        const selectedCount = allFeaturesSelected
            ? (matchingFeatureCount === null ? null : Math.max(0, matchingFeatureCount - excludedFeatureIds.size))
            : selectedFeatureIds.size;
        const fullySelected = matchingFeatureCount !== null && matchingFeatureCount > 0
            ? selectedCount === matchingFeatureCount
            : allFeaturesSelected && excludedFeatureIds.size === 0;
        selectAllCheckbox.checked = fullySelected;
        selectAllCheckbox.indeterminate = !fullySelected &&
            (selectedCount === null ? excludedFeatureIds.size > 0 : selectedCount > 0);
    }

    function updateMatchingFeatureCount(){
        const version = loadVersion;
        const conditions = activeFilters();
        if (kmlType) {
            matchingFeatureCount = layer.getSource().getFeatures().filter(feature =>
                conditions.every(filter => matchesFilter(feature, filter))).length;
            updateSelectionHeader();
            return;
        }

        const where = conditions.length ? `WHERE ${conditions.map(sqlFilterCondition).join(' AND ')}` : '';
        requestToDB(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(layerID)} ${where}`, data => {
            if (version !== loadVersion) return;
            matchingFeatureCount = Number(data.rows.item(0).count);
            updateSelectionHeader();
        }, error => {
            if (version !== loadVersion) return;
            console.error('Feature selection count query failed:', error);
        });
    }

    function getPropertyPage(featureID){
        let layer = findLayer(layerID)
        let feature = findFeatureByID(layer, featureID)
        document.querySelector('#myNavigator').pushPage('./views/featureProperties.html', {data: {feature: feature}});
    }

    function editFeaturesTable(event){
        let divClass = event.target.className
        divClass = divClass.split(" ")[0]
        if(divClass == 'feat_left'){
            left_row = event.target.value
            filters.left = '';
        }
        else if(divClass == 'feat_right'){    
            right_row = event.target.value
            filters.right = '';
        }
        resetFeaturesList();
    }

    function checkPosition(){
        if (!loadingRows && hasMore &&
            scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 100) {
            showFeaturesList();
        }
    }

    function activeFilters(){
        return ['left', 'right'].map(side => ({
            atrib: getAtribByName(layerAtribs, side === 'left' ? left_row : right_row),
            value: filters[side].trim()
        })).filter(filter => filter.value !== '');
    }

    function showEmptySelectionToast(){
        ons.notification.toast('Выберите объект(ы) для взаимодействия', {
            timeout: 2000,
            animation: 'ascend'
        });
    }

    function resolveSelectedFeatures(onSuccess, errorMessage){
        const sourceFeatures = layer.getSource().getFeatures();
        const selectedIds = new Set(selectedFeatureIds);
        const excludedIds = new Set(excludedFeatureIds);
        if (!allFeaturesSelected) {
            onSuccess(sourceFeatures.filter(feature => selectedIds.has(String(feature.id))));
            return;
        }

        const conditions = activeFilters();
        if (kmlType) {
            onSuccess(sourceFeatures.filter(feature =>
                !excludedIds.has(String(feature.id)) &&
                conditions.every(filter => matchesFilter(feature, filter))));
            return;
        }
        if (conditions.length === 0) {
            onSuccess(sourceFeatures.filter(feature => !excludedIds.has(String(feature.id))));
            return;
        }

        const where = conditions.map(sqlFilterCondition).join(' AND ');
        requestToDB(`SELECT ${quoteIdentifier(layerAtribs[0].name)} AS id FROM ${quoteIdentifier(layerID)} WHERE ${where}`,
            data => {
                const matchingIds = new Set();
                for (let i = 0; i < data.rows.length; i++) matchingIds.add(String(data.rows.item(i).id));
                onSuccess(sourceFeatures.filter(feature =>
                    matchingIds.has(String(feature.id)) && !excludedIds.has(String(feature.id))));
            },
            error => {
                console.error('Feature selection query failed:', error);
                ons.notification.alert({title: 'Ошибка', message: errorMessage});
            });
    }

    function showSelectedFeaturesOnMap(){
        if (!allFeaturesSelected && selectedFeatureIds.size === 0) {
            showEmptySelectionToast();
            return;
        }

        const showFeatures = features => {
            if (features.length === 0) {
                showEmptySelectionToast();
                return;
            }
            const selected = features.filter(feature => {
                const geometry = feature.getGeometry();
                return geometry && geometry.getExtent().every(Number.isFinite);
            });
            if (selected.length === 0) {
                ons.notification.alert({title: 'Внимание', message: 'Выбранные объекты не найдены на карте.'});
                return;
            }

            const extent = ol.extent.createEmpty();
            selected.forEach(feature => ol.extent.extend(extent, feature.getGeometry().getExtent()));
            const navigator = document.querySelector('#myNavigator');
            navigator.popPage({times: navigator.pages.length - 1}).then(() => {
                requestAnimationFrame(() => {
                    if (!layer.getVisible()) {
                        layer.visible = true;
                        layer.setVisible(true);
                        saveLayersVisibility();
                    }
                    map.updateSize();
                    map.getView().fit(extent, {padding: [40, 40, 40, 40], maxZoom: 18, duration: 300});
                    selectFeatures(selected);
                });
            });
        };
        resolveSelectedFeatures(showFeatures, 'Не удалось выбрать объекты для показа на карте.');
    }

    function confirmDeleteSelectedFeatures(){
        if (deletingFeatures) return;
        if (!allFeaturesSelected && selectedFeatureIds.size === 0) {
            showEmptySelectionToast();
            return;
        }

        resolveSelectedFeatures(features => {
            if (features.length === 0) {
                showEmptySelectionToast();
                return;
            }
            if (!layer.enabled) {
                ons.notification.alert({title: 'Внимание', message: 'Этот слой недоступен для редактирования.'});
                return;
            }
            ons.notification.confirm({
                title: 'Подтверждение удаления',
                message: `Вы уверены, что хотите безвозвратно удалить ${features.length} объект(ов)?`,
                buttonLabels: ['Отмена', 'Удалить']
            }).then(index => {
                if (index === 1) {
                    deletingFeatures = true;
                    deleteSelectedFeatures(features);
                }
            });
        }, 'Не удалось выбрать объекты для удаления.');
    }

    function deleteSelectedFeatures(features){
        const source = layer.getSource();
        const finishDelete = () => {
            const highlighted = findInteraction(ol.interaction.Select)?.getFeatures();
            if (highlighted) features.forEach(feature => highlighted.remove(feature));
            features.forEach(feature => source.removeFeature(feature));
            layer.changed();
            countLabel.textContent = `Объектов в слое: ${source.getFeatures().length}`;
            resetFeaturesList();
            deletingFeatures = false;
        };

        if (kmlType) {
            features.forEach(feature => feature.deleted = true);
            syncChangesWithKML(layerID, finishDelete, error => {
                console.error('KML feature deletion failed:', error);
                const currentFeatures = new Set(source.getFeatures());
                features.forEach(feature => {
                    feature.deleted = false;
                    if (!currentFeatures.has(feature)) source.addFeature(feature);
                });
                deletingFeatures = false;
            });
            return;
        }

        const ids = features.map(feature => feature.id);
        const idColumn = quoteIdentifier(layerAtribs[0].name);
        db.transaction(tx => {
            for (let start = 0; start < ids.length; start += 400) {
                const chunk = ids.slice(start, start + 400);
                const parameters = chunk.map(() => '?').join(', ');
                tx.executeSql(`DELETE FROM ${quoteIdentifier(layerID)} WHERE ${idColumn} IN (${parameters})`, chunk);
            }
        }, error => {
            console.error('Feature deletion failed:', error);
            deletingFeatures = false;
            ons.notification.alert({title: 'Ошибка', message: 'Не удалось удалить выбранные объекты.'});
        }, () => {
            finishDelete();
            const saved = saveDB();
            if (saved) saved.catch(error => {
                console.error('Database save failed after deletion:', error);
                ons.notification.alert({title: 'Ошибка', message: 'Объекты удалены, но не удалось сохранить изменения базы данных.'});
            });
        });
    }

    function matchesFilter(feature, filter){
        const rawValue = feature.get(filter.atrib.name);
        if (rawValue == null) return false;
        const value = filter.atrib.type === 'BOOLEAN'
            ? (rawValue === true || rawValue === 1 || rawValue === 'true' ? '1' :
                rawValue === false || rawValue === 0 || rawValue === 'false' ? '0' : String(rawValue))
            : String(rawValue);
        if (filter.atrib.type === 'ENUM' || filter.atrib.type === 'BOOLEAN') {
            return value === filter.value;
        }
        return value.toLocaleLowerCase().startsWith(filter.value.toLocaleLowerCase());
    }

    function quoteIdentifier(value){
        return `"${String(value).replace(/"/g, '""')}"`;
    }

    function sqlFilterCondition(filter){
        const column = quoteIdentifier(filter.atrib.name);
        const value = filter.value.replace(/'/g, "''");
        if (filter.atrib.type === 'ENUM' || filter.atrib.type === 'BOOLEAN') {
            return `${column} = '${value}'`;
        }
        const pattern = value.replace(/\\/g, '\\\\').replace(/[%_]/g, char => `\\${char}`);
        return `CAST(${column} AS TEXT) LIKE '${pattern}%' ESCAPE '\\'`;
    }

    function appendFeatureRow(id, leftValue, rightValue){
        const table = document.querySelector('#features-tbody');
        const line = document.createElement('tr');
        line.innerHTML = `<td class="features-select-cell">
                <label class="features-checkbox-label">
                    <input class="features-row-checkbox" type="checkbox" aria-label="Выбрать объект">
                    <span class="features-checkbox-visual" aria-hidden="true"></span>
                </label>
            </td>
            <td><div>${getValueFromLayerAtrib(layerID, left_row, leftValue)}</div></td>
            <td><div>${getValueFromLayerAtrib(layerID, right_row, rightValue)}</div></td>`;
        const checkbox = line.querySelector('.features-row-checkbox');
        const featureKey = String(id);
        checkbox.setAttribute('aria-label', `Выбрать объект ${featureKey}`);
        checkbox.checked = allFeaturesSelected
            ? !excludedFeatureIds.has(featureKey)
            : selectedFeatureIds.has(featureKey);
        checkbox.closest('td').addEventListener('click', event => event.stopPropagation());
        checkbox.addEventListener('change', () => {
            if (allFeaturesSelected) {
                if (checkbox.checked) excludedFeatureIds.delete(featureKey);
                else excludedFeatureIds.add(featureKey);
            } else {
                if (checkbox.checked) selectedFeatureIds.add(featureKey);
                else selectedFeatureIds.delete(featureKey);
            }
            updateSelectionHeader();
        });
        line.addEventListener('click', () => getPropertyPage(id));
        table.append(line);
    }

    function showFeaturesList(){
        if (loadingRows || !hasMore) return;
        loadingRows = true;
        const version = loadVersion;
        const conditions = activeFilters();

        if (kmlType) {
            const filtered = layer.getSource().getFeatures().filter(feature =>
                conditions.every(filter => matchesFilter(feature, filter)));
            const page = filtered.slice(offset, offset + limit);
            page.forEach(feature => {
                const properties = feature.getProperties();
                appendFeatureRow(properties.ID, properties[left_row], properties[right_row]);
            });
            offset += page.length;
            hasMore = offset < filtered.length;
            loadingRows = false;
            updateListPosition();
            return;
        }

        const where = conditions.length ? `WHERE ${conditions.map(sqlFilterCondition).join(' AND ')}` : '';
        const query = `SELECT ${quoteIdentifier(layerAtribs[0].name)} AS id,
            ${quoteIdentifier(left_row)} AS "left", ${quoteIdentifier(right_row)} AS "right"
            FROM ${quoteIdentifier(layerID)} ${where} LIMIT ${limit} OFFSET ${offset}`;
        requestToDB(query, function(data){
            if (version !== loadVersion) return;
            for (let i = 0; i < data.rows.length; i++) {
                const row = data.rows.item(i);
                appendFeatureRow(row.id, row.left, row.right);
            }
            offset += data.rows.length;
            hasMore = data.rows.length === limit;
            loadingRows = false;
            if (!hasMore) {
                matchingFeatureCount = offset;
                updateSelectionHeader();
            }
            updateListPosition();
        }, function(error){
            if (version !== loadVersion) return;
            loadingRows = false;
            hasMore = false;
            ons.notification.alert({title: 'Ошибка', message: 'Не удалось загрузить список объектов.'});
            console.error('Feature list query failed:', error);
        });
    }


    function showDialogSearch(side){
        ons.createElement('dialog_search', {append: true}).then(function(dialog){
            const atrib = getAtribByName(layerAtribs, side === 'left' ? left_row : right_row);
            dialog.querySelector('#filter-label').textContent = atrib.label;
            const control = atrib.type === 'ENUM' || atrib.type === 'BOOLEAN'
                ? document.createElement('select') : document.createElement('input');
            control.id = 'filter-value';
            if (control.tagName === 'SELECT') {
                control.add(new Option('Все значения', ''));
                const options = atrib.type === 'BOOLEAN'
                    ? { '1': 'Да', '0': 'Нет' } : (atrib.options || {});
                Object.entries(options).forEach(([value, label]) => control.add(new Option(label, value)));
            } else {
                control.type = atrib.type === 'DOUBLE' ? 'number' : atrib.type === 'DATE' ? 'date' : 'text';
            }
            control.value = filters[side];
            dialog.querySelector('#filter-control').append(control);

            dialog.querySelector('#accept-filter-button').addEventListener('click', () => {
                filters[side] = control.value;
                resetFeaturesList();
                hideDialog('dialog-search');
            });
            dialog.querySelector('#clear-filter-button').addEventListener('click', () => {
                filters[side] = '';
                resetFeaturesList();
                hideDialog('dialog-search');
            });
            dialog.show();
        });
    }
};
