class DrawButton extends ol.control.Control {
    constructor(opt_options) {
        const options = opt_options || {};

        const drawButton = ons.createElement(`<div class='draw-button' id='draw-button'><ons-fab class='map-control-fab' modifier='material' disable-auto-styling>
            <img class='map-primary-action-icon' src='./resources/images/assets/editGeometry.png' alt='Добавить объект'>
        </ons-fab></div>`);

        super({
            element: drawButton,
            target: options.target,
        });

        drawButton.addEventListener('click', this.clickDrawButton.bind(this), false);
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
}
