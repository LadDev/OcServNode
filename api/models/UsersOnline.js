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

module.exports = model('UsersOnline',schema)
