const cron = require('node-cron');
const { config } = require('dotenv')
const Nodes = require("../models/Nodes");
const DIR = `${__dirname}`.replace("/cron","")
config({path: `${DIR}/.env`});
const OcctlExec = require("../classes/OcctlExec.class");
const {dbConnect} = require("../db.connector")


// Создайте задачу, которая будет выполняться каждые 10 секунд
const task = cron.schedule('*/10 * * * * *', ()=>{
    return ;//usersSessionsTask();
});
dbConnect().then(()=>{
// Запустите задачу
    task.start();
})
