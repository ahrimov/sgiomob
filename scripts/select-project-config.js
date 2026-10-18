const fs = require('fs');
const path = require('path');

module.exports = function (context) {
    const platforms = context.opts.platforms || [];
    if (!platforms.includes('android')) return;

    const root = context.opts.projectRoot;
    const profile = process.env.SGIOMOB_BUILD_PROFILE || 'development';
    if (!['development', 'production'].includes(profile)) {
        throw new Error(`Unknown SGIOMOB_BUILD_PROFILE: ${profile}`);
    }

    const source = profile === 'production'
        ? path.join(root, 'config', 'production', 'config.xml')
        : path.join(root, 'www', 'resources', 'Project', 'config.xml');
    const destination = path.join(
        root, 'platforms', 'android', 'app', 'src', 'main', 'assets',
        'www', 'resources', 'Project', 'config.xml'
    );

    if (!fs.existsSync(source) || !fs.existsSync(destination)) {
        throw new Error(`Cannot select ${profile} project config: ${source} -> ${destination}`);
    }
    fs.copyFileSync(source, destination);
    console.log(`Project config for Android: ${profile}`);
};
