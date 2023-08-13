const cron = require('node-cron');
const { config } = require('dotenv')
const Nodes = require("../models/Nodes");
const DIR = `${__dirname}`.replace("/cron","")
config({path: `${DIR}/.env`});
const OcctlExec = require("../classes/OcctlExec.class");
const {dbConnect} = require("../db.connector")
const os = require("os");
const EditorConf = require("../classes/editor.conf");
const editor = new EditorConf();
const { version } = require('../package.json');

const serverStats = async () => {
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

    const cpuUsage = await editor.getCpuUsage();
    const diskUsage = await editor.getDiskUsage();
    const platform = os.platform()
    const distro = await editor.getLinuxDistro()
    const freemem = os.freemem()
    const totalmem = os.totalmem()
    let occtlStatus = await new OcctlExec().status()
    if(occtlStatus === {}) occtlStatus = null;
    const uuid = process.env.UUID


    const node = await Nodes.findOne({uuid: process.env.UUID})
    if(!node){
        const newNode = new Nodes({
            uuid: process.env.UUID,
            hostname: os.hostname(),
            interfaces,
            status: {cpuUsage, diskUsage, platform, distro, freemem, totalmem, occtlStatus, version, uuid},
            version
        })
        await newNode.save()
    }else{
        node.hostname = os.hostname()
        node.version = version
        node.interfaces = interfaces
        node.status = {cpuUsage, diskUsage, platform, distro, freemem, totalmem, occtlStatus, version, uuid}
        await node.save()
    }
}


// Создайте задачу, которая будет выполняться каждые 45 секунд
const task = cron.schedule('*/45 * * * * *', ()=>{
    return serverStats();
});
dbConnect().then(()=>{
// Запустите задачу
    task.start();
})
