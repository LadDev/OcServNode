const {Schema, model} = require('mongoose')
const schema = new Schema({
    uid: {type: String, default: null},
    uuid: {type: String, default: null},
    userName: {type: String, required: true},
    groupName: {type: String, default: null},
    invocationId: {type: String, default: null},
    sesId: {type: Number, default: 0},
    vhost: {type: String, default: null},
    device: {type: String, default: null},
    mtu: {type: Number, default: 0},
    remoteIp: {type: String, default: null},
    location: {type: String, default: null},
    localDeviceIp: {type: String, default: null},
    ipv4: {type: String, default: null},
    ptpipv4: {type: String, default: null},
    rx: {type: Number, default: 0},
    tx: {type: Number, default: 0},
    averageTx: {type: String, default: null},
    averageRx: {type: String, default: null},
    dpd: {type: Number, default: 0},
    keepalive: {type: Number, default: 0},
    session: {type: String, default: null},
    fullSession: {type: String, default: null},
    tlsCiphersuite: {type: String, default: null},
    dns: {type: Array, default: []},
    nbns: {type: Array, default: []},
    splitDnsDomains: {type: Array, default: []},
    restrictedToRoutes: {type: Boolean, default: false},
    restrictedToPorts: {type: Array, default: []},
    hostname: {type: String, default: null},
    statsBytesIn: {type: Number, default: 0},
    statsBytesOut: {type: Number, default: 0},
    status: {type: String, default: null},
    connectAt: {type: Date, default: Date.now},
})

module.exports = model('Sessions',schema)

/**
 * Script invoked at Sat 12 Aug 2023 04:38:42 PM MSK
 * HOSTNAME=
 * PIDFILE=/run/ocserv.pid
 * OCSERV_DNS4=1.1.1.1 8.8.8.8
 * PWD=/
 * IP_REAL=193.110.22.173
 * USERNAME=hela
 * LANG=en_US.UTF-8
 * INVOCATION_ID=e3ebfb199fd7436e9c725e924cc4ddd3
 * VHOST=default
 * IP_LOCAL=10.0.0.1
 * REASON=connect
 * ID=5563
 * OCSERV_DNS=1.1.1.1 8.8.8.8
 * SHLVL=1
 * GROUPNAME=home
 * IP_REMOTE=10.0.0.195
 * DEVICE=vpns0
 * JOURNAL_STREAM=9:28386
 * PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
 * IP_REAL_LOCAL=31.172.78.14
 * _=/usr/bin/printenv
 * -----------------------------------
 */
