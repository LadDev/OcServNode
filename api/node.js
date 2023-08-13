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
const EditorConf = require("./classes/editor.conf");
const OcctlExec = require("./classes/OcctlExec.class");
const editor = new EditorConf();

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

        let interfaces = []

        try{
            const interfacesTMP = await editor.exec("ip -j -s addr | jq")
            if(interfacesTMP.out){
                const interfacesJSON = JSON.parse(interfacesTMP.out)
                for(const interf of interfacesJSON){
                    if(interf.ifname && interf.ifname !== "lo" && !interf.ifname.startsWith("vpns")){
                        interfaces.push(interf)
                    }
                }
            }
        }catch (e) {
            console.error(e)
        }

        let status = null

        try{
            const cpuUsage = await editor.getCpuUsage();
            const diskUsage = await editor.getDiskUsage();
            const platform = os.platform()
            const distro = await editor.getLinuxDistro()
            const freemem = os.freemem()
            const totalmem = os.totalmem()
            let occtlStatus = await new OcctlExec().status()
            if(occtlStatus === {}) occtlStatus = null;
            const uuid = process.env.UUID

            status = {cpuUsage, diskUsage, platform, distro, freemem, totalmem, occtlStatus, version, uuid}
        }catch (e) {
            console.error(e)
        }

        const node = await Nodes.findOne({uuid: process.env.UUID})
        if(!node){
            const response = await axios.get('https://ifconfig.me');

            const newNode = new Nodes({
                uuid: process.env.UUID,
                ip: response.data,
                hostname: os.hostname(),
                interfaces,
                status,
                version,
                apiKey: process.env.API_KEY
            })
            await newNode.save()
            updateEnvVariable("GLOBAL_IP", response.data)
            config()
        }else{
            const response = await axios.get('https://ifconfig.me');
            node.hostname = os.hostname()
            node.ip = response.data
            node.version = version
            node.interfaces = interfaces
            node.status = status
            node.apiKey = process.env.API_KEY
            await node.save()
        }

        try{
            await editor.exec("chmod +x scripts/connect-script.sh")
            await editor.exec("chmod +x scripts/disconnect-script.sh")
            await editor.exec("chmod +x scripts/user_connect.js")
            await editor.exec("chmod +x scripts/user_disconnect.js")
        }catch (e) {
            console.error(e)
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
