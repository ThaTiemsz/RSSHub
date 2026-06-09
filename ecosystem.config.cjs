module.exports = {
    apps: [
        {
            name: 'rsshub',
            script: 'dist/index.mjs',
            interpreter: '/home/ubuntu/.nvm/versions/node/v24.16.0/bin/node',
            env: {
                NODE_ENV: 'production',
                NODE_OPTIONS: '--max-http-header-size=32768',
            },
            time: true,
        },
    ],
};
