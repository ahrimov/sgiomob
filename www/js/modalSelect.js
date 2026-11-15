let modalSelectPending = false;

function createModalSelect(dict, element_id, selected=null, hasSearch=true, title='Значение'){
    if (modalSelectPending || !document.getElementById(element_id)) return;
    modalSelectPending = true;
    ons.createElement('modalSelect.html', {append: true})
        .then(function(dialog){
            dialog.addEventListener('posthide', () => {
                dialog.remove();
                modalSelectPending = false;
            }, {once: true});
            dialog.querySelector('#modal-select-title').textContent = title;
            let content = dialog.querySelector('#select-list');
            const scrollArea = dialog.querySelector('.modal-select');
            const scrollbar = dialog.querySelector('.modal-select-scrollbar');
            const thumb = dialog.querySelector('.modal-select-scrollbar-thumb');

            function updateScrollbar(){
                const trackHeight = scrollbar.clientHeight;
                if (!trackHeight) return;
                const maxScroll = Math.max(0, scrollArea.scrollHeight - scrollArea.clientHeight);
                const thumbHeight = maxScroll
                    ? Math.min(trackHeight, Math.max(24, trackHeight * scrollArea.clientHeight / scrollArea.scrollHeight))
                    : trackHeight;
                const thumbRange = trackHeight - thumbHeight;
                thumb.style.height = `${thumbHeight}px`;
                thumb.style.transform = `translateY(${maxScroll ? scrollArea.scrollTop / maxScroll * thumbRange : 0}px)`;
            }

            function scrollToPointer(event){
                const maxScroll = scrollArea.scrollHeight - scrollArea.clientHeight;
                const thumbRange = scrollbar.clientHeight - thumb.offsetHeight;
                if (maxScroll <= 0 || thumbRange <= 0) return;
                const top = event.clientY - scrollbar.getBoundingClientRect().top - thumb.offsetHeight / 2;
                scrollArea.scrollTop = Math.max(0, Math.min(thumbRange, top)) / thumbRange * maxScroll;
            }

            scrollArea.addEventListener('scroll', updateScrollbar, {passive: true});
            scrollbar.addEventListener('pointerdown', event => {
                event.preventDefault();
                scrollbar.setPointerCapture(event.pointerId);
                scrollToPointer(event);
            });
            scrollbar.addEventListener('pointermove', event => {
                if (scrollbar.hasPointerCapture(event.pointerId)) scrollToPointer(event);
            });

            showList(dict, content, selected);
            dialog.onDeviceBackButton = closeModalSelect;

            if (hasSearch) {
                const searchContainer = dialog.querySelector('#select-search-container');
                const searchInput = document.createElement('ons-list-item');
                searchInput.className = 'select-search';
                searchInput.innerHTML = `
                    <ons-input id="select-search" placeholder="Поиск"></ons-input>
                `;
                searchContainer.appendChild(searchInput);

                const input = dialog.querySelector('#select-search');
                input.oninput = function() {
                    content.innerHTML = '';
                    showList(dict, content, selected, input.value);
                    requestAnimationFrame(updateScrollbar);
                };
            }
 
            return dialog.show().then(() => requestAnimationFrame(updateScrollbar));
        })
        .catch(error => {
            document.getElementById('modal-select')?.remove();
            modalSelectPending = false;
            console.error('Не удалось открыть справочник:', error);
        });
    
    function showList(dict, content, selected, filter=null){
        for(let key in dict){
            if(filter !== null && dict[key].search(filter) === -1) continue;
            let item = ons._util.createElement("<ons-list-item tappable></ons-list-item>");
            item.textContent = dict[key];
            if(selected != null && selected == key){
                const check = document.createElement('ons-icon');
                check.className = 'icon modal-select-check';
                check.setAttribute('icon', 'md-check');
                item.appendChild(check);
            }
            item.addEventListener("click", event => {
                event.stopPropagation();
                returnSelectedValue(key, element_id);
            }, false);
            content.appendChild(item);
        }
    }
}

function closeModalSelect(){
    document.getElementById('modal-select')?.hide();
}

function returnSelectedValue(key, element_id){
    const selectElement = document.getElementById(element_id);
    selectElement.value = key;
    closeModalSelect();

    const event = new Event('change', { bubbles: true });
    selectElement.dispatchEvent(event);
}

function callModalSelectWithLayerAtribs(layer_id, atribName, element_id){
    let layer = findLayer(layer_id);
    let selected = document.getElementById(element_id).value;
    let atrib = getAtribByName(layer.atribs, atribName);
    createModalSelect(atrib.options, element_id, selected, true, atrib.label || atrib.name);
}

function simpleCreateModalSelect(element_id, titleOverride=null, hasSearch=true){
    let select = document.getElementById(element_id);
    let selected_value = select.value;
    let options = {};
    for(let option of select.options){
        let value = option.value;
        let text = option.text;
        options[value] = text;
    }
    const title = titleOverride || select.closest('tr')?.querySelector('.title')?.textContent?.trim() || 'Значение';
    createModalSelect(options, element_id, selected_value, hasSearch, title);
}
