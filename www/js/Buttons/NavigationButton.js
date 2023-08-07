class NavigationButton extends ol.control.Control {
    constructor(opt_options) {
        const options = opt_options || {};

        const navButton = ons.createElement(`<div class='nav-button' id='nav-button'><ons-fab  modifier='mini'>
            <ons-icon icon='md-navigation' id="navigation-button-icon"></ons-icon>
        </ons-fab></div>`);

        super({
            element: navButton,
            target: options.target,
        });

        navButton.addEventListener('click', this.trackDevice.bind(this), false);
    }

    isActive = false;

    trackDevice(){

        if(this.isActive){
            this.isActive = false;
            document.getElementById('navigation-button-icon').style.color = '#000000';
            window.removeEventListener("deviceorientationabsolute", getorientation, true);
            navigationIsActive = false;
            const view = map.getView();
            view.setRotation(0);
            map.getInteractions().forEach(inter => inter.setActive(true));
            return;
        }

        this.isActive = true;
        document.getElementById('navigation-button-icon').style.color = '#2375fa';
        window.addEventListener("deviceorientationabsolute", getorientation, true);
        navigationIsActive = true;
        map.getInteractions().forEach(inter => inter.setActive(false));
        if(!gps_position) return;
        map.getView().setCenter(ol.proj.fromLonLat([gps_position.coords.longitude, gps_position.coords.latitude])); 
    }
}

let prevRadians;

function getorientation(event) {
    const accuracy = 0.025;
    const compassbearing = Number(360 - event.alpha).toFixed();
    const view = map.getView();
    let radians = (-compassbearing * (Math.PI/180)).toFixed(2);
    if(!prevRadians)
        prevRadians = radians;
    if(Math.abs(prevRadians - parseFloat(radians)) > accuracy){
        prevRadians = parseFloat(radians);
        view.setRotation(radians);
        // view.animate({
        //     rotation: radians,
        //     durations: 100
        // })
    }
}