class GPSButton extends ol.control.Control {
    constructor(opt_options) {
        const options = opt_options || {};

        const gpsButton = ons.createElement(`<div class='gps-button' id='gps-button'><ons-fab  modifier='mini'>
            <ons-icon icon='md-gps'></ons-icon>
        </ons-fab></div>`);

        super({
            element: gpsButton,
            target: options.target,
        });

        gpsButton.addEventListener('click', this.centerGPS.bind(this), false);
    }

    isActive = false;

    centerGPS(){

        if(this.isActive){
            this.isActive = false;
            window.removeEventListener("deviceorientationabsolute", getorientation, true);
            const view = map.getView();
            view.setRotation(0);
            return;
        }

        this.isActive = true;
        const view = new ol.View({
            center: ol.proj.fromLonLat([gps_position.coords.longitude, gps_position.coords.latitude]),
            zoom: map.getView().getZoom(),
            minZoom: currentMapView.getMinZoom(),
            maxZoom: currentMapView.getMaxZoom()
        })
        currentMapView = view;
        map.setView(currentMapView);

        window.addEventListener("deviceorientationabsolute", getorientation, true);
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
    }
}