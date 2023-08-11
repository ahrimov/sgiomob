function changeVisible(element){
    var layerID = element.getAttribute("data-id");
    for(layer of layers){
      if(layer.id == layerID){
        if(layer.visible == layer.getVisible()){
          layer.visible = !layer.visible;
          layer.setVisible(layer.visible);
        }
        else{
          ons.notification.alert({title:"Внимание", meassage:'Слой невозможно отобразить.'})
        }
        if(layer.getVisible()){
          element.style.backgroundColor = '#2375fa';
        }
        else{
          element.style.backgroundColor = '#FFFFFF';
        }
      }
    }
  }

  function createFileChooserForKML(layerID, callback){
    ons.createElement('choose_path_to_KML', {append: true})
            .then(function(dialog){
                document.querySelector('#buttonFileChooser').addEventListener('click', () => {
                  const media_radio = document.querySelector('#media-path');
                  const iternal_radio = document.querySelector('#iternal-path');
                  if(media_radio.checked){
                    callback(media_directory + "KML/", layerID);
                  }
                  else if (iternal_radio.checked){
                    callback(root_directory + pathToKMLStorage, layerID);
                  }
                  hideDialog('choose-path-to-KML');
                }, false)
                dialog.show()
            })
  }


  function showActionSheet(element, event){
    event.stopPropagation()
    var layerID = element.getAttribute("layer_id")
    const layer = findLayer(layerID);
    ons.openActionSheet({
      cancelable: true,
      buttons: [
        {
          label: 'Список атрибутов',
          modifier: 'destructive'
        },
        {
          label: 'Экспорт kml',

        },
        {
          label: 'Импорт kml',
        },
        {
          label: 'Очистить слой'
        },
        {
          label: 'Назад',
          icon: 'md-close'
        }
      ]
    }).then(function (index) {
        if(index == 0){
          document.querySelector('#myNavigator').pushPage('./views/features.html', {data: {layerID: layerID}});
        }
        if(index == 1){
          if(!layer.enabled){
            ons.notification.alert({title:"Внимание", message: "Этот слой нельзя экспортировать"});
          }
          else{
            createFileChooserForKML(layerID, exportKML);
          }
        }
        if(index == 2){
          createFileChooserForKML(layerID, chooseFile);
        }
        if(index == 3){
          clearLayer(layerID)
        }
      });
  }

  function chooseFile(pathToKML, layerID){
    ons.createElement('file_chooser', {append: true})
      .then(function(dialog){
        let content = document.getElementById('dialog-file-chooser-content')
        showAllFilesAtDir(pathToKML, function(entries){
          let html = ''
          for(let entry of entries){
            if(entry.name.search(`.xml`)){
              var item = ons._util.createElement("<ons-list-item tappable></ons-list-item>")
              item.innerHTML = `${entry.name}`
              item.addEventListener("click", () => {
                hideDialog('file-chooser')
                compareAtribs(layerID, entry.nativeURL)
              }, false)
              content.appendChild(item)
            }
          }
        })
        dialog.show()
      })
  }

  function compareAtribs(layerID, pathToKML){
    let layer = findLayer(layerID)
    openFile(pathToKML, function(data){
        let format = new ol.format.KML()
/*
        data = data.replace(/nan/g, "0")
        const array = [...data.matchAll(/\d*.\d*,\d*.\d*,(\d*.\d*)/g)];
        for(let elem of array){
          data = data.replace(elem[1], 0)
        }*/

        let features = format.readFeatures(data.replace(/nan/g, "0"))
        if(features.length == 0){
            ons.notification.alert({title:"Внимание", message:'Элементы не найдены'})
            return
        }
        let properties = features[0].getProperties()
        ons.createElement('comparison_KML', {append: true})
            .then(function(dialog){
                let html = '<table class="dialog-comparison-KML-table">'
                for(let atrib of layer.atribs){
                    html += `<tr class='property'>
                        <td class='left_property title'>${atrib.name}</td>`

                    let select = `<ons-select class='right_property' id='${atrib.name}' onclick="simpleCreateModalSelect('${atrib.name}')">`
                    select += `<option value="" selected disabled hidden>Нет соотвествия</option>`
                    for(var prop in properties){
                        let selected = ''
                        if(atrib.name.toLowerCase() == prop.toLowerCase()){
                            selected = ` selected="selected" `
                        }
                        select += `<option value='${prop}'${selected}>${prop}</option>`
                    }
                    select += `</ons-select>`

                    html += `<td>${select}</td>
                        </tr>`
                }
                html += `</table>`
                document.querySelector('#dialog-list-properties').innerHTML = html
                document.querySelector('#acceptImportKML').addEventListener('click', () => {acceptImportKML(layerID, features)}, false)
                dialog.show()
            })
    })
  }

  function acceptImportKML(layerID, features){
    let dict = {}
    let htmlProperties = document.querySelectorAll('.property')
    for(let elem of htmlProperties){
      let left = elem.querySelector('.left_property').textContent
      let right = elem.querySelector('.right_property').value
      dict[left] = right.toLowerCase();
    }
    importKML(layerID, dict, features)
    hideDialog('comparison-KML')
  }

  function clearLayer(layerID){
    let layer = findLayer(layerID)
    ons
    .notification.confirm({title: 'Очистка слоя', messageHTML: `<p class="notification-alert">Вы уверены, что хотите очитстить слой ${layer.label}?</p>`, buttonLabels: ["Нет", "Да"]})
    .then(function(index) {
        if(index == 1){
          let query = `DELETE FROM ${layer.id}`
          requestToDB(query, function(res){
            layer.getSource().clear(true)
            ons.notification.alert({title:"Внимание", message:`Слой ${layer.label} очищен`})
            saveDB()
          })
        }
    });

  }

  function clickRasterMenu(event){
    event.stopPropagation()
    showRasterSheet()
  }

function createBaseRasterList(){
  const template = document.querySelector('#baseRasterLayerListItem');
  const list = document.querySelector('#base-raster-layers-list');
  const sortBaseLayers = baseRasterLayers.sort((a, b) => b.getZIndex() - a.getZIndex());
  sortBaseLayers.forEach((layer) => {
    const listItem = template.content.cloneNode(true);
    listItem.querySelector('.label-base-raster-layer').innerHTML = layer.get('descr');
    
    const iconUrl = cordova.file.applicationDirectory + 'www/resources/images/logos/' + layer.get('icon');
    const iconElement = listItem.querySelector('.icon-base-raster-layers');
    loadImageFromFile(iconUrl, iconElement, () => {
      console.log('Icon not found');
      loadImageFromFile(cordova.file.applicationDirectory + 'www/resources/images/logos/map_24x24.png', iconElement, () => {
        console.log('Default icon not found');
      })
    });
    
    if(layer.getVisible())
      listItem.querySelector('.base-raster-switch-visible').setAttribute('checked');
    if(layer.get('useLocalTiles'))
      listItem.querySelector('.base-raster-local-switch').setAttribute('checked')
    listItem.querySelector('.base-raster-switch-visible').addEventListener('change',  () => {
      const visibility = layer.getVisible();
      layer.setVisible(!visibility);
      updateInfo();
    });
    listItem.querySelector('.base-raster-local-switch').addEventListener('change', () => {
      const useLocalTiles = !layer.get('useLocalTiles');
      layer.set('useLocalTiles', useLocalTiles);
      if(useLocalTiles){
        const local_path = layer.get('local_path');
        layer.getSource().setUrl(main_directory + local_path);
        layer.getSource().setTileLoadFunction(tileLoadFunctionLocal);
      }
      else{
        const remote_url = layer.get('remote_url');
        layer.getSource().setTileLoadFunction(tileLoadFunctionDefault);
        if(layer.get("id") === 'Rosreestr'){
          layer.getSource().setTileUrlFunction(rosreetrUrlFunction);
        }
        else{
          layer.getSource().setUrl(remote_url);
        }
      } 
      updateInfo();
    });
    list.appendChild(listItem);
  });
}

function loadImageFromFile(filename, element, onError) {
    window.resolveLocalFileSystemURL(filename, addIconToElement, onError);

    function addIconToElement(fileEntry){
        fileEntry.file(function (file) {
            const reader = new FileReader();
            reader.onloadend = function() {
                if (this.result) {
                    const blob = new Blob([new Uint8Array(this.result)], { type: "image/png" });
                    element.src = window.URL.createObjectURL(blob);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }
}
