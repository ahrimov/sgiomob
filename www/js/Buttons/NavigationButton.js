class NavigationButton extends ol.control.Control {
    constructor(opt_options) {
        const options = opt_options || {};

        const navButton = ons.createElement(`<div class='nav-button' id='nav-button'><ons-fab id='ons-nav-button' modifier='mini'>
            <ons-icon icon='md-navigation' id="navigation-button-icon"></ons-icon>
        </ons-fab></div>`);

        super({
            element: navButton,
            target: options.target,
        });

        navButton.addEventListener('click', this.trackDevice.bind(this), false);
    }

    trackDevice(){

        if(!hasGeolocationPermission){
            ons.notification.toast('Доступ к геолокации заблокирован', {timeout: 1000, animation: "ascend"}); 
            return;
        }

        if(!gps_position) {
            ons.notification.toast('Ожидание gps-сигнала', {timeout: 1000, animation: "ascend"}); 
            return;
        }

        switch(navigationMode){
            case NAVIGATION_MODE.DISABLED:
                navigationMode = NAVIGATION_MODE.TURN_NAVIGATION_ARROW;
                turnOnNavigation();
                document.getElementById('navigation-button-icon').style.color = '#2375fa';
                if(!gps_position) return;
                map.getView().animate({
                    center: ol.proj.fromLonLat([gps_position.coords.longitude, gps_position.coords.latitude])
                });
                break;
            case NAVIGATION_MODE.TURN_NAVIGATION_ARROW:
                navigationMode = NAVIGATION_MODE.HOLD_CENTER_MAP;
                document.getElementById('navigation-button-icon').style.color = '#ffffff';
                document.getElementById('ons-nav-button').style.backgroundColor = '#2375fa';
                window.addEventListener("deviceorientationabsolute", getorientation, true);
                map.getView().setCenter(ol.proj.fromLonLat([gps_position.coords.longitude, gps_position.coords.latitude]));
                map.getInteractions().forEach(x => x.setActive(false));
                const gpsLayer = getLayerById(GPS_LAYER_ID);
                const geoMarker = getFeatureByName(GEO_MARKER_NAME, gpsLayer);
                geoMarker.getStyle().getImage().setRotation(0);
                // map.once('pointermove',  function(){
                //     if(navigationMode !== NAVIGATION_MODE.HOLD_CENTER_MAP) return;
                //     navigationMode = NAVIGATION_MODE.TURN_NAVIGATION_ARROW;
                //     document.getElementById('navigation-button-icon').style.color = '#2375fa';
                //     document.getElementById('ons-nav-button').style.backgroundColor = '#ffffff';
                //     window.removeEventListener("deviceorientationabsolute", getorientation, true);
                // });
                break;
            case NAVIGATION_MODE.HOLD_CENTER_MAP:
                navigationMode =  NAVIGATION_MODE.DISABLED;
                document.getElementById('navigation-button-icon').style.color = '#000000';
                document.getElementById('ons-nav-button').style.backgroundColor = '#ffffff';
                window.removeEventListener("deviceorientationabsolute", getorientation, true);
                const view = map.getView();
                view.setRotation(0);
                turnOffNavigation();
                map.getInteractions().forEach(x => x.setActive(true));
                break;
            default: break;
        }
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