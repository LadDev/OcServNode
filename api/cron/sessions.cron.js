const cron = require('node-cron');
const { config } = require('dotenv')
const mongoose = require("mongoose");
const Sessions = require("../models/Sessions");
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

const updateOnlineSessions = async (userSession) => {
    if(userSession){

        const uoDB = await UsersOnline.findOne({userName: userSession.username, session: userSession.session, fullSession: userSession.fullsession})
        if(uoDB){
            const sessionDB = await Sessions.findOne({uuid: uoDB.uuid, uid: uoDB.uid,userName: userSession.username, session: userSession.session, fullSession: userSession.fullsession});
            if(sessionDB){
                sessionDB.state = userSession.state || "unknown"
                sessionDB.groupName = userSession.groupname || "*"
                sessionDB.vhost = userSession.vhost || "unknown"
                sessionDB.useragent = userSession.useragent || "unknown"
                sessionDB.remoteIp = userSession.remoteip || "unknown"
                sessionDB.location = userSession.location || "unknown"
                sessionDB.session_is_open = userSession.session_is_open || 0
                sessionDB.tls_auth_ok = userSession.tls_auth_ok || 0
                sessionDB.in_use = userSession.in_use || 0
                sessionDB.connected = true
                sessionDB.created = userSession.created || null
                sessionDB.closed =  null
                sessionDB.statsBytesIn = Number(uoDB.rx)
                sessionDB.statsBytesOut = Number(uoDB.tx)
                await sessionDB.save()
            }else{
                const newSessDB = new Sessions({
                    uid: uoDB.uid,
                    uuid: uoDB.uuid,
                    userName: userSession.username,
                    session: userSession.session,
                    fullSession: userSession.fullsession,
                    state: userSession.state || "unknown",
                    groupName: userSession.groupname || "*",
                    vhost: userSession.vhost || "unknown",
                    useragent: userSession.useragent || "unknown",
                    remoteIp: userSession.remoteip || "unknown",
                    location: userSession.location || "unknown",
                    session_is_open: userSession.session_is_open || 0,
                    tls_auth_ok: userSession.tls_auth_ok || 0,
                    in_use: userSession.in_use || 0,
                    connected: true,
                    created: userSession.created || null,
                    closed:  null,
                    statsBytesIn: Number(uoDB.rx),
                    statsBytesOut: Number(uoDB.tx)
                });
                await newSessDB.save()
            }
        }
    }
    return 1;
}


const usersSessionsTask = async () => {
    try{
        const usersSessions = await new OcctlExec().sessions()
        if(usersSessions){
            for(const userSession of usersSessions){
                await updateOnlineSessions(userSession)
            }
        }
    }catch (error) {
        console.error(error)
    }

    return true;
}


// Создайте задачу, которая будет выполняться каждые 10 секунд
const task = cron.schedule('*/10 * * * * *', ()=>{
    return usersSessionsTask();
});
start().then(()=>{
// Запустите задачу
    task.start();
})
