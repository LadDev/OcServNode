const {Schema, model} = require('mongoose')
const schema = new Schema({
    uid: {type: String, default: null},
    uuid: {type: String, default: null},
    session: {type: String, required: true},
    fullSession: {type: String, required: true},
    state: {type: String, default: null},
    userName: {type: String, required: true},
    groupName: {type: String, default: null},
    vhost: {type: String, default: null},
    useragent: {type: String, default: null},
    remoteIp: {type: String, default: null},
    location: {type: String, default: null},
    session_is_open: {type: Number, default: 0},
    tls_auth_ok: {type: Number, default: 0},
    in_use: {type: Number, default: 0},
    connected: {type: Boolean, default: false},
    statsBytesIn: {type: Number, default: 0},
    statsBytesOut: {type: Number, default: 0},
    created: {type: Date, default: Date.now},
    closed: {type: Date, default: null},
})

module.exports = model('Sessions',schema)
