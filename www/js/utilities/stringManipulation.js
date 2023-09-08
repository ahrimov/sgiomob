function insert(main_string, ins_string, pos) {
    if(typeof(pos) == "undefined") {
      pos = 0;
    }
    if(typeof(ins_string) == "undefined") {
      ins_string = '';
    }
      return main_string.slice(0, pos) + ins_string + main_string.slice(pos);
}

function clipping(string, limit){
    if(string.length > limit){
        return string.slice(0, limit) + "..."
      }
    return string
}

function formatDate(date){
  return `_${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}_${date.getHours()}${date.getMinutes()}${date.getSeconds()}`
}

function writeFeatureInKML(feature){
  const geometryType = feature.getGeometry().getType().toUpperCase();
  let coordinates = feature.getGeometry().getCoordinates();
  if(geometryType === 'MULTILINESTRING' || geometryType === 'MULTIPOLYGON'){
    coordinates = coordinates[0];
    if(geometryType === 'MULTIPOLYGON')
      coordinates = coordinates[0];
  }
  return `${geometryType} Z((${coordinates.map(coord => ` ${coord[0]} ${coord[1]} 0`).join(',')}))`;
}