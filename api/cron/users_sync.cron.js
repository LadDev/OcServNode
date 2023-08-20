const cron = require('node-cron');
const { config } = require('dotenv')
const Users = require("../models/Users");
const DIR = `${__dirname}`.replace("/cron","")
config({path: `${DIR}/.env`});
const {dbConnect} = require("../db.connector")
const fs = require("fs-extra");


const usersSync = async () => {

    let newUserFile = []

    const usersDB = await Users.find({enabled: true})
    if(usersDB){
        for(const user of usersDB){
            newUserFile.push(`${user.username}:${user.group}:${user.hashedPassword}`);
        }
    }

    const lines = newUserFile.join("\n")
    await fs.writeFile(process.env.OCSERV_PASS_PATH, lines);

}

const usersSyncTask = async () => {
    try{
        await usersSync(userSession)
    }catch (error) {
        console.error(error)
    }

    return true;
}


// Создайте задачу, которая будет выполняться каждые 10 секунд
const task = cron.schedule('0 * * * *', ()=>{
    return usersSyncTask();
});
dbConnect().then(()=>{
// Запустите задачу
    //usersSyncTask().then(()=>{})
    task.start();
})
