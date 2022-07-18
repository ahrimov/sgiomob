class CustomControls extends ol.control.Control {
    constructor(opt_options) {
      const options = opt_options || {};
  
      const buttonZoomPlus = ons.createElement(`<div class='zoom-plus'><ons-fab modifier='mini'>
                                                    <ons-icon icon='md-plus'></ons-icon>
                                                </ons-fab></div>`)
    
      const buttonZoomMinus = ons.createElement(`<div class='zoom-minus'><ons-fab modifier='mini'>
                                                    <ons-icon icon='md-minus'></ons-icon>
                                                </ons-fab></div>`)
      const gpsButton = ons.createElement(`<div class='gps-button'><ons-fab  modifier='mini'>
                                                <ons-icon icon='md-gps'></ons-icon>
                                            </ons-fab></div>`)
      let div = document.createElement('div')
      div.className = "att"
      let str = `<span class='dot'></span>
                <span id='info-label'>Онлайн</span>`
      div.innerHTML = str.trim()                                
      const element = document.createElement('div');
      element.className = 'buttons'

      element.appendChild(buttonZoomPlus)
      element.appendChild(buttonZoomMinus)
      element.appendChild(gpsButton)
      element.appendChild(div)
        
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

    map.on('click', function(evt){
        setTimeout(showDialogFeatures, 50, evt)
    })
    updateInfo()
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

function getValueFromLayerAtrib(layerID, atribName, value){
    if(typeof value == 'undefined'){
        return " "
    }
    let layer = findLayer(layerID)
    for(atrib of layer.atribs){
        if(atrib.name == atribName){
            switch(getTypeByAtribName(layer.atribs, atribName)){
                case "BOOLEAN":
                    if(value === 1){
                        return "Да"
                    }
                    else{
                        return "Нет"
                    }
                case "DATE":
                    return new Date(value).toLocaleString()
                default:
                    return value
            }
        }
    }
    return value
}

function turnGPS(){
    var gpsSource = new ol.source.Vector()
    var gpsLayer = new ol.layer.Vector({source: gpsSource})
    map.addLayer(gpsLayer)
    navigator.geolocation.watchPosition(function(position){
        gpsSource.clear()
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

        var circle = new ol.geom.Circle(ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]), position.coords.accuracy);
        var circle_feature = new ol.Feature(circle)
        circle_feature.setStyle(new ol.style.Style({
            
                fill: new ol.style.Fill({
                    color: [135, 207, 255, 0.5]
                }),
                stroke: new ol.style.Stroke({
                    color: '#2765f5',
                    with: 1
                })
        
        }))
        gpsSource.addFeature(circle_feature)
        gpsSource.addFeature(marker)
        
    });
}

 function updateInfo(){
    if(raster.isLocal){
        document.querySelector('#info-label').innerHTML = "Оффлайн"
        document.querySelector('.dot').setAttribute('style', 'background-color: #bbb;')
    }
    else{
        document.querySelector('#info-label').innerHTML = "Онлайн"
        document.querySelector('.dot').setAttribute('style', 'background-color: green;')
    }
 }


