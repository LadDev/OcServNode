const cron = require('node-cron');
const {exec} = require("child_process");
const {DateTime} = require("luxon");
const { config } = require('dotenv')
const mongoose = require("mongoose");
const UsersOnline = require("../models/UsersOnline");

const DIR = `${__dirname}`.replace("/cron","")
config({path: `${DIR}/.env`});
const OcctlExec = require("../classes/OcctlExec.class");

async function start(){
    try{
        mongoose.set('strictQuery', false);
        // Устанавливаем соединение с базой данных MongoDB
        await mongoose.connect(process.env.DATABASE, {
            useUnifiedTopology: true,
        })

    }catch (e){
        // В случае ошибки выводим сообщение об ошибке в консоль
        console.log("Server Error:", e.message)
        process.exit(0)
    }
}

start().then(()=>{

})

const updateOnlineUsers = async (userOnline) => {
    if(userOnline){
        const uoDB = await UsersOnline.findOne({sesId: userOnline.id, username: userOnline.username, fullSession: userOnline.fullsession})
        console.log(uoDB)
    }
    return 1;
}


const usersOnlineTask = async () => {
    try{
        const uo = await new OcctlExec().users()
        if(uo){
            for(const userOnline of uo){
                await updateOnlineUsers(userOnline)
            }
        }
    }catch (error) {
        console.error(error)
    }

    return true;
}

// Создайте задачу, которая будет выполняться каждые 10 секунд
const task = cron.schedule('*/10 * * * * *', ()=>{
    return usersOnlineTask();
});

// Запустите задачу
task.start();
