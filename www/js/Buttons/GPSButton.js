class GPSButton extends ol.control.Control {
    constructor(opt_options) {
        const options = opt_options || {};

        const gpsButton = ons.createElement(`<div class='gps-button' id='gps-button'><ons-fab class='map-control-fab' modifier='material mini' disable-auto-styling>
            <img class='gps-button-icon' src='./resources/images/assets/sight.png' alt='Показать местоположение'>
        </ons-fab></div>`);

        super({
            element: gpsButton,
            target: options.target,
        });

        gpsButton.addEventListener('click', this.centerGPS.bind(this), false);
    }

    centerGPS(){
        if(!hasGeolocationPermission){
            ons.notification.toast('Доступ к геолокации заблокирован', {timeout: 1000, animation: "ascend"}); 
            return;
        }

        if(!gps_position) {
            ons.notification.toast('Ожидание gps-сигнала', {timeout: 1000, animation: "ascend"}); 
            return;
        }
        map.getView().animate({
            center: ol.proj.fromLonLat([gps_position.coords.longitude, gps_position.coords.latitude])
        });
    }
}
