# Ориентиры для агентов

- Это Android-приложение на Cordova и OpenLayers. Исходники интерфейса находятся в `www/`: разметка в `views/`, стили в `css/`, логика в `js/`.
- Запуск и сборка описаны в `README.md`. Для разработки используется `npx cordova run android --emulator` или `--device`.
- Hook `scripts/select-project-config.js` при подготовке Android копирует конфигурацию разработки из `www/resources/Project/config.xml`; для production используется `config/production/config.xml`.
- Меняйте исходники в `www/` и файлы конфигурации проекта; не редактируйте сгенерированные `platforms/`, установленные `plugins/` и `node_modules/`.
- В `package.json` нет рабочего набора тестов (`npm test` намеренно завершается ошибкой). Проверяйте изменённый JavaScript через `node --check` и, когда возможно, запуском на эмуляторе или устройстве.
