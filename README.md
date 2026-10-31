# sgiomob

Гибридное Android-приложение для отображения офлайн-карт и векторных слоёв. Написано на Cordova, карты отображаются через OpenLayers.

## Запуск для разработки

Нужны Node.js, Java JDK и Android SDK. Команды выполняются из корня проекта. После первого клонирования установите зависимости:

```sh
npm ci
```

Запустите эмулятор в Android Studio или подключите телефон с включённой отладкой по USB. Проверьте, что Android Debug Bridge видит нужное устройство:

```sh
adb devices
```

Для эмулятора:

```sh
npx cordova run android --emulator
```

Для подключённого телефона:

```sh
npx cordova run android --device
```

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


