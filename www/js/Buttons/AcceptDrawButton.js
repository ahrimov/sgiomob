class AcceptDrawButton extends ol.control.Control {
    constructor(opt_options) {
      const options = opt_options || {};
  
      const acceptDrawButton = ons.createElement(`<div class='accept-draw-button'><ons-fab class='accept-draw-button-fab'>
                                                    <ons-icon class='icon' icon='md-check'></ons-icon>
                                                </ons-fab></div>`)
  
      super({
        element: acceptDrawButton,
        target: options.target,
      });

      acceptDrawButton.addEventListener('click', this.acceptDraw.bind(this), false);
    }

    acceptDraw(){
        let button = document.querySelector('.accept-draw-button-fab')
        if(!button.disabled){
            let coordString = map.draw.currentFeature.getGeometry().getCoordinates().toString()
            let len = coordString.split(',').length
            if(map.draw.currentFeature.getGeometry().getType() == 'LineString'){
              if(len <= 2){
                ons.notification.alert('Невозможно создать геометрию объекта')
                return;
              }
            }
            if(map.draw.currentFeature.getGeometry().getType() == 'Polygon'){
              if(len <= 4){
                ons.notification.alert('Невозможно создать геометрию объекта');
                return;
              }
            }
            
            map.draw.finishDrawing();
            document.querySelector('#myNavigator').pushPage('./views/newFeature.html', {data: {layer: map.activeLayer, feature: map.draw.currentFeature}});
        }
    }
}