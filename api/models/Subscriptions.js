const {Schema, model} = require('mongoose')
const schema = new Schema({
    name: {type: String, default: null},
    group: {type: String, default: null},
    count: {type: Number, default: 0},
    price: {type: Number, default: 1},
    upload: {type: Number, default: 0},
    download: {type: Number, default: 0},
    isDefault: {type: Boolean, default: false},
    active: {type: Boolean, default: true},
    createdAt: {type: Date, default: Date.now},
})

module.exports = model('Subscriptions',schema)
