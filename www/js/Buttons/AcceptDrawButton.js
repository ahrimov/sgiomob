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
        if(!button.disabled)
            document.querySelector('#myNavigator').pushPage('./views/newFeature.html', {data: {layer: map.activeLayer, feature: map.draw.currentFeature}});
    }
}