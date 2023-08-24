const {Schema, model} = require('mongoose')
const schema = new Schema({
    client_id: {type: Schema.Types.ObjectId, ref: 'Clients'},
    subscrId: {type: Schema.Types.ObjectId, ref: 'Subscriptions'},
    period: {type: Number, default: 2},
    activated: {type: Boolean, default: false},
    expired: {type: Boolean, default: false},
    startDate: {type: Date, default: null},
    endDate: {type: Date, default: null},
    paymentModelId: {type: String, default: ""}
})

module.exports = model('PurchasedSubscription',schema)
