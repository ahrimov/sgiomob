# sgiomob
Гибридное приложение на android по отображению оффлайновых карт и векторных слоёв для нефтегазовой отросли. Приложение написано с помощью фреймворка cordova. Для отображение карт используется библиотека openlayers.

## Production-сборка Android

```sh
npm run build:production
```

Команда собирает release APK с конфигурацией `config/production/config.xml`.

Для подписанной сборки укажите свой Cordova `build.json` с ключом подписи
(не храните файл и пароли в репозитории):

```sh
SGIOMOB_BUILD_PROFILE=production npx cordova build android --release \
  --buildConfig=/absolute/path/to/build.json -- --packageType=apk
```


