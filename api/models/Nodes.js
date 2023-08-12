const {Schema, model} = require('mongoose')
const schema = new Schema({
    uuid: {type: String, default: null},
    ip: {type: String, default: null},
    hostname: {type: String, default: null},
    regDate: {type: Date, default: Date.now},
})

module.exports = model('Nodes',schema)
