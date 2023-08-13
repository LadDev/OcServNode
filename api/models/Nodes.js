const {Schema, model} = require('mongoose')
const schema = new Schema({
    uuid: {type: String, default: null},
    ip: {type: String, default: null},
    hostname: {type: String, default: null},
    version: {type: String, default: null},
    interfaces: {type: Array, default: []},
    status: {type: Object, default: null},
    regDate: {type: Date, default: Date.now},
})

module.exports = model('Nodes',schema)
