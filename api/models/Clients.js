const {Schema, model} = require('mongoose')
const schema = new Schema({
    phone: {type: String, default: null},
    email: {type: String, default: null},
    userId: {type: Number, default: 0},
    lang_code: {type: String, default: null},
    userName: {type: String, default: null},
    firstName: {type: String, default: null},
    lastName: {type: String, default: null},
    avatar: {type: String, default: null},
    is_premium: {type: Boolean, default: false},
    confirmed: {type: Boolean, default: false},
    referal: {type: String, default: null},
    group: {type: String, default: "*"},
    country: {type: String, default: null},
    regDate: {type: Date, default: Date.now},
})

module.exports = model('Clients',schema)
