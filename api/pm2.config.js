module.exports = {
    apps: [
        {
            name: 'OcServNode',
            script: 'node.js',
            watch: true,
            ignore_watch: ['node_modules', 'logs', "db", "conf", "certs", "scripts", ".env"],
        },
    ],
};
