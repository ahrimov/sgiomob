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

        function getorientation(event) {
            const compassbearing = Number(360 - event.alpha).toFixed(1);
            console.log(compassbearing);
            const view = map.getView();
            view.setRotation(-compassbearing * (Math.PI/180));
        }