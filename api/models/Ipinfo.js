const {Schema, model} = require('mongoose')
const schema = new Schema({
    ip: {type: String, default: null},
    hostname: {type: String, default: null},
    city: {type: String, default: null},
    region: {type: String, default: null},
    country: {type: String, default: null},
    loc: {type: String, default: null},
    org: {type: String, default: null},
    postal: {type: String, default: null},
    timezone: {type: String, default: null},
})

module.exports = model('IpInfo',schema)
