const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const { config } = require('dotenv')
const fs = require('fs');
const Nodes = require("./models/Nodes")
const os = require('os');
const axios = require("axios");
const { version } = require('./package.json');
config()
const {dbConnect} = require("./db.connector")

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

const app = express();

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({limit: "500mb"}));
app.use(bodyParser.urlencoded({limit: "500mb", extended: true, parameterLimit:5000}));

app.use(function (req, res, next) {
    res.setHeader('X-Powered-By', 'LadDev Apps')
    next()
})

app.use("/api", require("./routes/api.route"))


const API_PORT = process.env.API_PORT || 10080

async function start(){
    try{
        await dbConnect()

        //const response = await axios.get('https://ifconfig.me');

        const node = await Nodes.findOne({uuid: process.env.UUID})
        if(!node){
            const response = await axios.get('https://ifconfig.me');

            const newNode = new Nodes({
                uuid: process.env.UUID,
                ip: response.data,
                hostname: os.hostname(),
                version
            })
            await newNode.save()
            updateEnvVariable("GLOBAL_IP", response.data)
            config()
        }else{
            const response = await axios.get('https://ifconfig.me');
            node.hostname = os.hostname()
            node.ip = response.data
            node.version = version
            await node.save()
        }

        app.listen(API_PORT, () => {
            console.info(`Server admin app has bin started on port ${API_PORT}`)
        })
    }catch (e){
        console.error("Server Error:", e.message)
        process.exit(0)
    }
}

start().then(()=>{})
