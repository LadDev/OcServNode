const {Schema, model} = require('mongoose')
const schema = new Schema({
    client_id: {type: String, default: null},
    username: {type: String, required: true},
    password: {type: String, required: true},
    hashedPassword: {type: String, required: true},
    group: {type: String, default: "*"},
    enabled: {type: Boolean, default: false},
    regDate: {type: Date, default: Date.now},
})

module.exports = model('Users',schema)
