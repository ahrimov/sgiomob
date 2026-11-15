function homeDisableButtons(){
    document.querySelector('#layers-button').disabled = true
}

function homeEnableButton(){
    document.querySelector('#layers-button').disabled = false
}

let aboutDialogOpening = false;

function showAboutPopover(button){
    const popover = document.getElementById('about-popover');
    if (!popover.hidden) {
        hideAboutPopover();
        return;
    }
    const bounds = button.getBoundingClientRect();
    popover.style.top = `${bounds.bottom + 6}px`;
    popover.style.right = `${Math.max(8, window.innerWidth - bounds.right)}px`;
    popover.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', closeAboutPopoverOnOutsideClick, true);
    document.addEventListener('keydown', closeAboutPopoverOnEscape, true);
}

function hideAboutPopover(){
    document.getElementById('about-popover').hidden = true;
    document.getElementById('about-menu-button')?.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', closeAboutPopoverOnOutsideClick, true);
    document.removeEventListener('keydown', closeAboutPopoverOnEscape, true);
}

function closeAboutPopoverOnOutsideClick(event){
    if (!document.getElementById('about-popover').contains(event.target) &&
        !document.getElementById('about-menu-button')?.contains(event.target)) {
        hideAboutPopover();
    }
}

function closeAboutPopoverOnEscape(event){
    if (event.key === 'Escape') {
        hideAboutPopover();
    }
}

async function showAboutDialog(){
    const dialog = document.getElementById('about-dialog');
    if (aboutDialogOpening || dialog.visible) return;
    aboutDialogOpening = true;
    try {
        hideAboutPopover();
        await dialog.show();
    } catch (error) {
        console.error('Не удалось открыть сведения о приложении:', error);
    } finally {
        aboutDialogOpening = false;
    }
}

function closeAboutDialog(){
    document.getElementById('about-dialog').hide();
}

function carousel_prev(){
    if (document.getElementById('draw-carousel-prev').hasAttribute('disabled')) return;
    document.getElementById('draw-bar').prev().then(updateDrawCarouselButtons);
}

function carousel_next(){
    if (document.getElementById('draw-carousel-next').hasAttribute('disabled')) return;
    document.getElementById('draw-bar').next().then(updateDrawCarouselButtons);
}

function updateDrawCarouselButtons(){
    const carousel = document.getElementById('draw-bar');
    const previous = document.getElementById('draw-carousel-prev');
    const next = document.getElementById('draw-carousel-next');
    if (!carousel || !previous || !next) return;

    const items = carousel.querySelectorAll('ons-carousel-item');
    const viewport = carousel.getBoundingClientRect();
    const canScroll = viewport.width > 0 && items.length > 0;
    const first = canScroll ? items[0].getBoundingClientRect() : null;
    const last = canScroll ? items[items.length - 1].getBoundingClientRect() : null;

    if (!canScroll || first.left >= viewport.left - 1) previous.setAttribute('disabled', '');
    else previous.removeAttribute('disabled');

    if (!canScroll || last.right <= viewport.right + 1) next.setAttribute('disabled', '');
    else next.removeAttribute('disabled');
}

function openFeatureProperties(feature, clickCoordinate){
    hideDialog('dialog-features')
    document.querySelector('#myNavigator').pushPage('./views/featureProperties.html', {data: {feature: feature, clickCoordinate: clickCoordinate}});
}

function showDialogFeatures(evt){
    let features = map.getFeaturesAtPixel(evt.pixel, {hitTolerance: globalHitTolerance})
    features = features.filter(feature => !isServiceFeature(feature));
    if(features.length == 0){
        return
    }
    const clickCoordinate = ol.proj.toLonLat(evt.coordinate, map.getView().getProjection());
    if(features.length == 1){
        openFeatureProperties(features[0], clickCoordinate)
        return
    }
    ons.createElement('dialog_features', {append: true})
        .then(function(dialog){
            let content = document.getElementById('dialog-features-content')
            for(const layer of layers){
                const layerFeatures = features.filter(feature => feature.layerID == layer.id)
                if(layerFeatures.length > 0){
                    const header = ons._util.createElement("<ons-list-header></ons-list-header>")
                    header.textContent = layer.label
                    content.appendChild(header)

                    for(const feature of layerFeatures){
                        const item = ons._util.createElement("<ons-list-item tappable></ons-list-item>")
                        item.textContent = `Элемент: ${feature.id}`
                        item.addEventListener("click", () => openFeatureProperties(feature, clickCoordinate), false)
                        content.appendChild(item)
                    }
                }
            }
            dialog.show()
        })
}

function openDrawBar(){
    let mapContainer = document.querySelector('#map-container')
    let drawBar = document.querySelector('#downbar-wrapper')
    mapContainer.style['height'] = mapContainerDownBarHeight;
    drawBar.style["display"] = "grid"
    map.updateSize();
    document.querySelector('.crosshair').style['top'] = crosshairDownbarTop;
    requestAnimationFrame(() => {
        document.getElementById('draw-bar').refresh();
        updateDrawCarouselButtons();
    });
}

function closeDrawBar(){
    let mapContainer = document.querySelector('#map-container')
    let drawBar = document.querySelector('#downbar-wrapper')
    mapContainer.style['height'] = "100%"
    drawBar.style["display"] = "none"
    map.updateSize();
    document.querySelector('.crosshair').style['top'] = '50%';
}

function createDrawBar(){
    let drawCarousel = document.querySelector('#draw-bar');

    const existingItems = drawCarousel.querySelectorAll('.carousel-item-content');
    
    existingItems.forEach(item => {
        item.parentNode.remove(); 
    });

    layers.sort(function(a, b){
        return b.getZIndex() - a.getZIndex();
      })
    for(const layer of layers){
        if(!layer.enabled) continue;
        let template = document.querySelector('#carousel-item')
        let carouselItem = template.content.cloneNode(true)
        carouselItem.querySelector('.carousel-item-content').innerHTML = `<p class='carousel-button-text'>${layer.label}</p>`
        carouselItem.querySelector('.carousel-item-content').addEventListener('click', function(){
            createFeature(layer);
        });
        drawCarousel.appendChild(carouselItem)
    }
    if (drawCarousel.clientWidth > 0) drawCarousel.refresh();
    requestAnimationFrame(updateDrawCarouselButtons);
}

function drawInstrumentCenter(){
    appendCoordinate(map.getView().getCenter())
}

function drawInstrumentGPS(){
    let coordinate = ol.proj.fromLonLat([gps_position.coords.longitude, gps_position.coords.latitude])
    map.getView().setCenter(coordinate)
    
    appendCoordinate(coordinate)
}

function showDrawInstrumentDialog(){
    ons.createElement('dialog_draw_instrument_coordinate', {append: true})
        .then(function(dialog){
            dialog.show()
        })
}

function drawInstrumentCoordinate(){
    let y = document.querySelector('#Y-value').value
    let x = document.querySelector('#X-value').value
    if(y < -90 || y > 90 || x > 180 || x < -180){
        ons.notification.alert({title:"Внимание", message:'Недопустимые значения координат'})
        return
    }
    hideDialog('dialog-draw-instrument-coordinate')
    appendCoordinate(ol.proj.fromLonLat([x, y]))
    map.getView().setCenter(ol.proj.fromLonLat([x, y]))
}

function hideDialog(id){
    let dialog = document.getElementById(id)
    if(dialog){
        dialog.remove()
    }
}
