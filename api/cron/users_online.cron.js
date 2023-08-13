const cron = require('node-cron');
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



const updateOnlineUsers = async (userOnline) => {
    if(userOnline){

        const uoDB = await UsersOnline.findOne({sesId: Number(userOnline.id), userName: userOnline.username})
        if(uoDB){
            uoDB.groupName = userOnline.groupname || "*"
            uoDB.vhost = userOnline.vhost || null
            uoDB.device = userOnline.device || null
            uoDB.mtu =  userOnline.mtu?Number(userOnline.mtu):0
            uoDB.remoteIp = userOnline.remoteip || null
            uoDB.location = userOnline.location || null
            uoDB.localDeviceIp = userOnline.localdeviceip || null
            uoDB.ipv4 = userOnline.ipv4 || null
            uoDB.ptpipv4 = userOnline.ptpipv4 || null
            uoDB.rx = userOnline.rx?Number(userOnline.rx):0
            uoDB.tx = userOnline.tx?Number(userOnline.tx):0
            uoDB.averageRx = userOnline.averagerx || null
            uoDB.averageTx = userOnline.averagetx || null
            uoDB.dpd = userOnline.dpd?Number(userOnline.dpd):0
            uoDB.keepalive =  userOnline.keepalive?Number(userOnline.keepalive):0
            uoDB.session = userOnline.session || null
            uoDB.fullSession = userOnline.fullsession || null
            uoDB.tlsCiphersuite = userOnline.tlsciphersuite || null
            uoDB.dns = userOnline.dns || []
            uoDB.status = userOnline.state || "unknown"
            await uoDB.save()
        }
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
start().then(()=>{
// Запустите задачу
    task.start();
})

