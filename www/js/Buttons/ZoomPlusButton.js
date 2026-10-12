class ZoomPlusButton extends ol.control.Control {
  constructor(opt_options) {
    const options = opt_options || {};

    const buttonZoomPlus = ons.createElement(`<div class='zoom-plus' id='zoom-plus'><ons-fab modifier='material mini' disable-auto-styling>
      <img class='zoom-button-icon' src='./resources/images/assets/zoom_in.png' alt='Увеличить масштаб'>
    </ons-fab></div>`);

    super({
      element: buttonZoomPlus,
      target: options.target,
    });

    buttonZoomPlus.addEventListener('click', this.zoomPlus.bind(this), false);
  }

  zoomPlus(){
    const view = this.getMap().getView();
    const zoom = view.getZoom();
    view.setZoom(zoom + 1)
  }
}
