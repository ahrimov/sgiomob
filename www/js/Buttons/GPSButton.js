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


    centerGPS(){
        if(!gps_position) return;
        map.getView().animate({
            center: ol.proj.fromLonLat([gps_position.coords.longitude, gps_position.coords.latitude])
        });
        // const view = new ol.View({
        //     center: ol.proj.fromLonLat([gps_position.coords.longitude, gps_position.coords.latitude]),
        //     zoom: map.getView().getZoom(),
        //     minZoom: currentMapView.getMinZoom(),
        //     maxZoom: currentMapView.getMaxZoom()
        // })
        // currentMapView = view;
        // map.setView(currentMapView);
    }
}