module.exports = {
    apps: [
        {
            name: 'OcServNode',
            script: 'node.js',
            watch: true,
            ignore_watch: ['node_modules', 'logs', "db", "conf", "certs", "scripts", ".env"],
        },
        {
            name: 'OcServNode-UsersOnline',
            script: 'cron/users_online.cron.js',
            watch: true,
            ignore_watch: ['node_modules', 'logs', "db", "conf", "certs", "scripts", ".env"],
        },
        {
            name: 'OcServNode-Sessions',
            script: 'cron/sessions.cron.js',
            watch: true,
            ignore_watch: ['node_modules', 'logs', "db", "conf", "certs", "scripts", ".env"],
        },
    ],
};
