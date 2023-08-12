// const EditorConf = require("./editor.conf");
//
// const editor = new EditorConf()
//
// editor.read('./conf/ocserv.conf').then(async ()=>{
//     await editor.uncommentParam("ipv6-subnet-prefix")
//     await editor.setParam("ipv6-subnet-prefix", 64)
//     //await editor.commentParam("ipv6-subnet-prefix")
//     //console.log(editor.params)
// })
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const { config } = require('dotenv')
const fs = require('fs');
config()

function updateEnvVariable(key, value) {
    const envPath = '.env';
    let envContent = fs.readFileSync(envPath, 'utf8');

    const regex = new RegExp(`^(${key}=)(.*)$`, 'm');
    if (envContent.match(regex)) {
        // Если ключ уже существует, обновляем его
        envContent = envContent.replace(regex, `$1${value}`);
    } else {
        // Если ключа нет, добавляем его в конец файла
        envContent += `\n${key}=${value}\n`;
    }

    fs.writeFileSync(envPath, envContent);
}

if(!process.env.UUID){
    const { v4: uuidv4 } = require('uuid');
    const uniqueId = uuidv4();
    updateEnvVariable("UUID", uniqueId)
    config()
}


const mongoose = require("mongoose");
const axios = require("axios");

const node = express();

node.use(cors())

node.use(bodyParser.urlencoded({ extended: false }))
node.use(bodyParser.json({limit: "500mb"}));
node.use(bodyParser.urlencoded({limit: "500mb", extended: true, parameterLimit:5000}));

node.use(function (req, res, next) {
    res.setHeader('X-Powered-By', 'LadDev Apps')
    next()
})

node.use("/api", require("./routes/api.route"))


const API_PORT = process.env.API_PORT || 10080

async function start(){
    try{
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.DATABASE, {
            useUnifiedTopology: true,
        })

        const response = await axios.get('https://ifconfig.me');
        console.log("Data",response.data);

        node.listen(API_PORT, () => {
            console.log(`Server admin app has bin started on port ${API_PORT}`)
        })
    }catch (e){
        // В случае ошибки выводим сообщение об ошибке в консоль
        console.log("Server Error:", e.message)
        process.exit(0)
    }
}

start().then(()=>{})
