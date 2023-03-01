class CustomControls extends ol.control.Control {
    constructor(opt_options) {
      const options = opt_options || {};
  
      const buttonZoomPlus = ons.createElement(`<div class='zoom-plus' id='zoom-plus'><ons-fab modifier='mini'>
                                                    <ons-icon icon='md-plus'></ons-icon>
                                                </ons-fab></div>`)
      const buttonZoomMinus = ons.createElement(`<div class='zoom-minus' id='zoom-minus'><ons-fab modifier='mini'>
                                                    <ons-icon icon='md-minus'></ons-icon>
                                                </ons-fab></div>`)
      const gpsButton = ons.createElement(`<div class='gps-button' id='gps-button'><ons-fab  modifier='mini'>
                                                <ons-icon icon='md-gps'></ons-icon>
                                            </ons-fab></div>`)
      const drawButton = ons.createElement(`<div class='draw-button' id='draw-button'><ons-fab>
                                            <ons-icon class='icon' icon='md-plus'></ons-icon>
                                        </ons-fab></div>`)
      const cancelButton = ons.createElement(`<div class='cancel-button' id='cancel-button'><ons-fab modifier='mini'>
                                            <ons-icon icon='md-close'></ons-icon>
                                        </ons-fab></div>`)
      let div = document.createElement('div')
      div.id = "tile-status-bar";
      div.className = "att"
      let str = `<span class='dot'></span>
                <span id='info-label'>Онлайн</span>`
      div.innerHTML = str.trim()                           
      const element = document.createElement('div');
      element.className = 'buttons'

      element.append(drawButton)
      element.appendChild(buttonZoomPlus)
      element.appendChild(buttonZoomMinus)
      element.appendChild(gpsButton)
      element.appendChild(cancelButton)
      element.appendChild(div)
        
      super({
        element: element,
        target: options.target,
      });
  
      drawButton.addEventListener('click', this.clickDrawButton.bind(this), false);
      buttonZoomPlus.addEventListener('click', this.zoomPlus.bind(this), false);
      buttonZoomMinus.addEventListener('click', this.zoomMinus.bind(this), false);
      gpsButton.addEventListener('click', this.centerGPS.bind(this), false);
      cancelButton.addEventListener('click', this.cancelDraw.bind(this), false);
    }
  
    zoomPlus(){
        const view = this.getMap().getView();
        const zoom = view.getZoom();
        view.setZoom(zoom + 1)
    }

    zoomMinus(){
        const view = this.getMap().getView();
        const zoom = view.getZoom();
        view.setZoom(zoom - 1)
    }

    centerGPS(){
        var view = new ol.View({
            center: ol.proj.fromLonLat([gps_position.coords.longitude, gps_position.coords.latitude]),
            zoom: currentMapView.getMaxZoom(),
            minZoom: currentMapView.getMinZoom(),
            maxZoom: currentMapView.getMaxZoom()
        })
        currentMapView = view
        map.setView(currentMapView)
    }

    clickDrawButton(){
        let drawBar = document.querySelector('#downbar-wrapper')
        let style = window.getComputedStyle(drawBar);
        let display = style.getPropertyValue('display');
        if(display == 'none'){
            openDrawBar()
        }
        else{
            closeDrawBar()
        }
    }

    cancelDraw(){
        if(typeof map.draw.currentFeature != 'undefined'){
            let layer = map.activeLayer
            layer.getSource().removeFeature(map.draw.currentFeature)
        }

        finishDraw()
    }
}