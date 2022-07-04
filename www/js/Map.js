class CustomControls extends ol.control.Control {
    constructor(opt_options) {
      const options = opt_options || {};
  
      const buttonZoomPlus = ons.createElement(`<ons-fab class='zoom-plus' modifier='mini'>
                                                    <ons-icon icon='md-plus'></ons-icon>
                                                </ons-fab>`)
    
      const buttonZoomMinus = ons.createElement(`<ons-fab class='zoom-minus' modifier='mini'>
                                                    <ons-icon icon='md-minus'></ons-icon>
                                                </ons-fab>`)
      const gpsButton = ons.createElement(`<ons-fab class='gps-button' modifier='mini'>
                                                <ons-icon icon='md-gps'></ons-icon>
                                            </ons-fab>`)                                         
      const element = document.createElement('div');
      element.className = 'buttons'
      element.appendChild(buttonZoomPlus)
      element.appendChild(buttonZoomMinus)
      element.appendChild(gpsButton)
        
      super({
        element: element,
        target: options.target,
      });
  
      buttonZoomPlus.addEventListener('click', this.zoomPlus.bind(this), false);
      buttonZoomMinus.addEventListener('click', this.zoomMinus.bind(this), false);
      gpsButton.addEventListener('click', this.centerGPS.bind(this), false);
    }
  
    zoomPlus(){
        const view = this.getMap().getView();
        const zoom = view.getZoom();
        view.setZoom(zoom + 1)
    }

    zoomMinus(){
        const view = this.getMap().getView();
        const zoom = view.getZoom();
        view.setZoom(zoom - 1)
    }

    centerGPS(){
        var view = new ol.View({
            center: ol.proj.fromLonLat([gps_position.coords.longitude, gps_position.coords.latitude]),
            zoom: currentMapView.getMaxZoom(),
            minZoom: currentMapView.getMinZoom(),
            maxZoom: currentMapView.getMaxZoom()
        })
        currentMapView = view
        map.setView(currentMapView)
    }
}

function showMap(){
    var scaleLine = new ol.control.ScaleLine({
        units: 'metric',
    })
      
    map = new ol.Map({
        target: 'map-container',
        layers: [raster],
        view: currentMapView,
        controls: [scaleLine, new CustomControls]
    });
    for(layer of layers){
        map.addLayer(layer)
    }

    let selectClick = new ol.interaction.Select({condition: ol.events.condition.click});
    map.addInteraction(selectClick);

    selectClick.on('select', function(e) {
        let featureSelected = e.selected[0];
        let layer = selectClick.getLayer(featureSelected);
        document.querySelector('#myNavigator').pushPage('./views/featureProperties.html', {data: {layerID: layer.id, featureID: featureSelected.id}});
    });
}

function findLayer(layerID){
    for(layer of layers){
        if(layer.id == layerID){
            return layer
        }
    }
    return null
}

class LayerAtribs{
    constructor(name, label, type){
        this.name = name
        this.label = label
        this.type = type
    }

}

function getTypeByAtribName(atribs, atribName){
    for(atrib of atribs){
        if(atrib.name == atribName){
            return atrib.type
        }
    }
}

function turnGPS(){
    navigator.geolocation.watchPosition(function(position){
        gps_position = position
        var point = new ol.geom.Point(ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]))
        var marker = new ol.Feature(point)
        marker.setStyle(new ol.style.Style({
            image: new  ol.style.Circle({
                radius: 7,
                fill: new  ol.style.Fill({
                    color: '#fcfafa',
                }),
                stroke: new ol.style.Stroke({
                    color: '#1870f5',
                    width: 2
                })
            })
        }))
        var gpsSource = new ol.source.Vector()
        gpsSource.addFeature(marker)
        var gpsLayer = new ol.layer.Vector({source: gpsSource})
        map.addLayer(gpsLayer)
    });
}

