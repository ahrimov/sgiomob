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
    var raster = new ol.layer.Tile({
        source: new ol.source.OSM({})
    });
    map = new ol.Map({
        target: 'map-container',
        layers: [raster],
        view: new ol.View({
          center: ol.proj.fromLonLat([55.4362, 58.7667]),
          zoom: 5,
          minZoom: 1,
          maxZoom: 20
        }),
        controls: [scaleLine, new CustomZoom]
    });
    for(layer of layers){
        map.addLayer(layer)
    }

    /*map.on('click', ({ pixel }) => {
        displayModuleFeature(pixel);
    });*/
    let selectClick = new ol.interaction.Select({condition: ol.events.condition.click});
    map.addInteraction(selectClick);

    selectClick.on('select', function(e) {
        let featureSelected = e.selected[0];
        let layer = selectClick.getLayer(featureSelected);
        document.querySelector('#myNavigator').pushPage('./views/featureProperties.html', {data: {layerID: layer.id, featureID: featureSelected.id}});
    });
}


/*
function displayModuleFeature(pixel) {
    var selectClick = new ol.interaction.Select({})
    if(features.length == 1){
        var featureID = features[0].id
        var layer = selectClick.getLayer(features[0]) 
        console.log(layer)
        document.querySelector('#myNavigator').pushPage('./views/featureProperties.html', {data: {layerID: layer.id, featureID: featureID}});
    }
    else if(features.length > 0 ){
        console.log(features)
    }
}*/


