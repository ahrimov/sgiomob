class CustomZoom extends ol.control.Control {
    constructor(opt_options) {
      const options = opt_options || {};
  
      const buttonZoomPlus = ons.createElement(`<ons-fab class='zoom-plus' modifier='mini'>
                                                    <ons-icon icon='md-plus'></ons-icon>
                                                </ons-fab>`)
    
      const buttonZoomMinus = ons.createElement(`<ons-fab class='zoom-minus' modifier='mini'>
                                                    <ons-icon icon='md-minus'></ons-icon>
                                                </ons-fab>`)
      const element = document.createElement('div');
      element.className = 'zoom-buttons'
      element.appendChild(buttonZoomPlus);
      element.appendChild(buttonZoomMinus)
  
      super({
        element: element,
        target: options.target,
      });
  
      buttonZoomPlus.addEventListener('click', this.zoomPlus.bind(this), false);
      buttonZoomMinus.addEventListener('click', this.zoomMinus.bind(this), false);
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
}

function showMap(){
    var scaleLine = new ol.control.ScaleLine({
        units: 'metric',
    })
    /*var raster = new ol.layer.Tile({
        source: new ol.source.OSM({})
      });*/
      
    map = new ol.Map({
        target: 'map-container',
        layers: [raster],
        view: currentMapView,
        controls: [scaleLine, new CustomZoom]
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


