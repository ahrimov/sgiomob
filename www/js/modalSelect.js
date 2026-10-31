function createModalSelect(dict, element_id, selected=null, hasSearch=true, title='Значение'){
    let element = document.getElementById(element_id);
    element.disabled = true;
    element.disabled = false;
    ons.createElement('modalSelect.html', {append: true})
        .then(function(dialog){
            dialog.querySelector('#modal-select-title').textContent = title;
            let content = document.getElementById('select-list');
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
            dialog.onDeviceBackButton = () => { hideDialog('modal-select') }

            if (hasSearch) {
                const searchContainer = document.getElementById('select-search-container');
                const searchInput = document.createElement('ons-list-item');
                searchInput.className = 'select-search';
                searchInput.innerHTML = `
                    <ons-input id="select-search" placeholder="Поиск"></ons-input>
                `;
                searchContainer.appendChild(searchInput);

                const input = document.getElementById('select-search');
                input.oninput = function() {
                    content.innerHTML = '';
                    showList(dict, content, selected, input.value);
                    requestAnimationFrame(updateScrollbar);
                };
            }
 
            dialog.show().then(() => requestAnimationFrame(updateScrollbar));
        })
    
    function showList(dict, content, selected, filter=null){
        for(let key in dict){
            if(filter !== null && dict[key].search(filter) === -1) continue;
            let item = ons._util.createElement("<ons-list-item tappable></ons-list-item>");
            item.innerHTML = dict[key];
            if(selected != null && selected == key)
                item.innerHTML += `<ons-icon class="icon modal-select-check" icon="md-check"></ons-icon>`;
            item.addEventListener("click", () => returnSelectedValue(key, element_id), false);
            content.appendChild(item);
        }
    }
}

function returnSelectedValue(key, element_id){
    const selectElement = document.getElementById(element_id);
    selectElement.value = key;
    hideDialog('modal-select');

    const event = new Event('change', { bubbles: true });
    selectElement.dispatchEvent(event);
}

function callModalSelectWithLayerAtribs(layer_id, atribName, element_id){
    let layer = findLayer(layer_id);
    let selected = document.getElementById(element_id).value;
    let atrib = getAtribByName(layer.atribs, atribName);
    createModalSelect(atrib.options, element_id, selected, true, atrib.label || atrib.name);
}

function simpleCreateModalSelect(element_id){
    let select = document.getElementById(element_id);
    let selected_value = select.value;
    let options = {};
    for(let option of select.options){
        let value = option.value;
        let text = option.text;
        options[value] = text;
    }
    const title = select.closest('tr')?.querySelector('.title')?.textContent?.trim() || 'Значение';
    createModalSelect(options, element_id, selected_value, true, title);
}
