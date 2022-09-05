function autonumericID(idName, layer){
    requestToDB(`SELECT MAX(${idName}) as id FROM ${layer.id}`, function(data){
      let id = 0
      if(typeof data.rows.item(0).id != 'undefined')
        id = data.rows.item(0).id + 1
      return id
    }, 'Ошибка генерации id')
  }