const mongoose = require("mongoose");
const {models} = require("mongoose");

async function dbConnect(){
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.DATABASE, {
        useUnifiedTopology: true,
    })
}

models.export = {dbConnect}
