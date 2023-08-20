const {Schema, model} = require('mongoose')
const schema = new Schema({
    name: {type: String, required: true},
    config: {type: Object, required: true},
    created: {type: Date, default: Date.now},
})

module.exports = model('NodeConfigsBlank',schema)
