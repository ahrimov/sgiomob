class CancelButton extends ol.control.Control {
    constructor(opt_options) {
        const options = opt_options || {};

        const cancelButton = ons.createElement(`<div class='cancel-button' id='cancel-button'><ons-fab class='map-control-fab' modifier='material mini' disable-auto-styling aria-label='Отмена' title='Отмена'>
            <img class='map-drawing-control-icon' src='./resources/images/assets/delete.png' alt=''>
        </ons-fab></div>`)

        super({
            element: cancelButton,
            target: options.target,
        });

        cancelButton.addEventListener('click', this.cancelDraw.bind(this), false);
    }

    cancelDraw(){
        if(typeof map.draw?.currentFeature != 'undefined'){
            let layer = map.activeLayer
            layer.getSource().removeFeature(map.draw.currentFeature)
        }

        if (map.draw) finishDraw();

        if (map.modify) {
            map.modify.modifyFeature?.setGeometry(map.modify.oldGeometry);
            removeModify();
        }
    }
}
