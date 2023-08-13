const mongoose = require("mongoose");

async function dbConnect(){
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.DATABASE, {
        useUnifiedTopology: true,
    })
}

module.exports = {dbConnect}
