const {Schema, model} = require('mongoose')
const schema = new Schema({
    name: {type: String, required: true},
    groupName: {type: String, default: ""},
    isDefault: {type: Boolean, default: false},
    isSubscription: {type: Boolean, default: false},
    config: {type: String, default: ""},
    created: {type: Date, default: Date.now},
})

module.exports = model('NodeConfigBlank',schema)
