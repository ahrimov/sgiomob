class UndoButton extends ol.control.Control {
    constructor(opt_options) {
        const options = opt_options || {};
    
        const undoButton = ons.createElement(`<div class='undo-button'><ons-fab modifier='mini'>
                                                <ons-icon icon='md-undo'></ons-icon>
                                            </ons-fab></div>`)
    
        super({
          element: undoButton,
          target: options.target,
        });

        undoButton.addEventListener('click', this.undoDraw.bind(this), false);
      }

      undoDraw(){
        if(typeof map.draw != 'undefined')
            map.draw.removeLastPoint()
      }
}
