class ZoomMinusButton extends ol.control.Control {
    constructor(opt_options) {
        const options = opt_options || {};

        const buttonZoomMinus = ons.createElement(`<div class='zoom-minus' id='zoom-minus'><ons-fab modifier='material mini' disable-auto-styling>
            <img class='zoom-button-icon' src='./resources/images/assets/zoom_out.png' alt='Уменьшить масштаб'>
        </ons-fab></div>`);

        super({
            element: buttonZoomMinus,
            target: options.target,
        });

        buttonZoomMinus.addEventListener('click', this.zoomMinus.bind(this), false);
    }

    zoomMinus(){
        const view = this.getMap().getView();
        const zoom = view.getZoom();
        view.setZoom(zoom - 1)
    }
}
