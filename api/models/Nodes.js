const {Schema, model} = require('mongoose')
const schema = new Schema({
    uuid: {type: String, default: null},
    ip: {type: String, default: null},
    hostname: {type: String, default: null},
    version: {type: String, default: null},
    interfaces: {type: Array, default: []},
    status: {type: Object, default: null},
    apiKey: {type: String, default: null},
    port: {type: Number, default: null},
    ipinfo: {type: Object, default: null},
    configured: {type: Boolean, default: false},
    regDate: {type: Date, default: Date.now},
})

module.exports = model('Nodes',schema)
