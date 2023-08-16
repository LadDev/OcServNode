const {Router} = require("express")
const router = Router()
const EditorConf = require("../classes/editor.conf");
const auth = require("../middleware/auth.middleware");
const fs = require("fs-extra");
const fss = require("fs");
const os = require("os");
const OcctlExec = require("../classes/OcctlExec.class");
const editor = new EditorConf();
const { version } = require('../package.json');
const bcrypt = require('bcrypt');
const Users = require("../models/Users");
const Nodes = require("../models/Nodes");
const speedTest = require('speedtest-net');

(async () => {
    await editor.read(process.env.OCSERV_CONF_PATH)
})();

const getStatus = async () => {
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
        node.status = {cpuUsage, diskUsage, platform, distro, freemem, totalmem, occtlStatus, version, uuid}
        await node.save()
    }

    return {cpuUsage, diskUsage, platform, distro, freemem, totalmem, occtlStatus, version, uuid}
}

router.get("/system/status", auth, async (req, res) => {
    try {
        res.status(200).json({code: 0, status: await getStatus()})
    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

router.get("/system/status/interfaces", auth, async (req, res) => {
    try {

        const interfacesTMP = await editor.exec("ip -j -s addr | jq")
        let interfaces = []

        if(interfacesTMP.out){
            const interfacesJSON = JSON.parse(interfacesTMP.out)
            for(const interf of interfacesJSON){
                if(interf.ifname && interf.ifname !== "lo" && !interf.ifname.startsWith("vpns")){
                    interfaces.push(interf)
                }
            }
        }

        res.status(200).json({code: 0, interfaces})
    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

router.get("/git-update", auth, async (req, res) => {
    try {
        await editor.exec("git stash")
        await editor.exec("git pull --force")
        await editor.exec("chmod +x scripts/connect-script.sh")
        await editor.exec("chmod +x scripts/disconnect-script.sh")
        await editor.exec("chmod +x scripts/user_connect.js")
        await editor.exec("chmod +x scripts/user_disconnect.js")
        res.status(200).json({code: 0})
    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

router.get("/configs", auth, async (req, res) => {
    try {
        let params = {...editor.params}
        delete params.commented
        res.status(200).json({code: 0, params})
    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

router.post("/configs/create", auth, async (req, res) => {
    try {
        const {config} = req.body
        await editor.create(config)
        await editor.exec("service ocserv restart")
        res.status(200).json({code: 0, params: config || {}})
    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

router.post("/system/command/:command", auth, async (req, res) => {
    try {
        const {command} = req.params
        let mess = ""
        if (command) {
            if (command === "start" || command === "restart") {
                const {out} = await editor.exec(`service ocserv ${command}`)
                mess = out
            } else if (command === "stop") {
                const {out} = await editor.exec(`occtl stop now`)
                mess = out
                await editor.exec(`service ocserv stop`)
            } else if (command === "reload" || command === "reset") {
                const {out} = await editor.exec(`occtl ${command}`)
                mess = out
            }
        }
        res.status(200).json({code: 0, message: mess, status: await getStatus()})
    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

router.post("/configs/cerificates", auth, async (req, res) => {
    try {

        const {privkey, ca_bundle, certificate, fullchain} = req.body
        await editor.exec("service ocserv stop")
        try {
            await editor.exec("mkdir -p /var/certs")
        } catch (e) {
            console.error(e)
        }

        if (fullchain && privkey) {
            const privkeyString = Buffer.from(privkey, 'base64').toString('utf8');
            const fullchainString = Buffer.from(fullchain, 'base64').toString('utf8');
            try {
                await fs.writeFile("/var/certs/privkey.pem", privkeyString);
                await fs.writeFile("/var/certs/fullchain.pem", fullchainString);
            } catch (e) {
                console.error(e)
                return res.status(500).json({code: -1, message: "Error in Certs Data"})
            }
        } else if (ca_bundle && certificate && privkey) {
            const privkeyString = Buffer.from(privkey, 'base64').toString('utf8');
            const ca_bundleString = Buffer.from(ca_bundle, 'base64').toString('utf8');
            const certificateString = Buffer.from(certificate, 'base64').toString('utf8');
            try {
                const fullchain_new = `${certificateString}${ca_bundleString}`
                await fs.writeFile("/var/certs/privkey.pem", privkeyString);
                await fs.writeFile("/var/certs/fullchain.pem", fullchain_new);
            } catch (e) {
                console.error(e)
                return res.status(500).json({code: -1, message: "Error in Certs Data"})
            }
        } else {
            return res.status(500).json({code: -1, message: "Error in Certs Data"})
        }

        await editor.setParam("server-cert", "/var/certs/fullchain.pem")
        await editor.setParam("server-key", "/var/certs/privkey.pem")


        await editor.exec("service ocserv start")

        res.status(200).json({code: 0, params: editor.params})
    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

router.post("/exec/:script", auth, async (req, res) => {
    try {

        const {script} = req.params
        const {scriptBody, command} = req.body


        let scriptBodyDecoded = Buffer.from(scriptBody, 'base64').toString('utf8');

        await fs.writeFile(`./scripts/${script}`, scriptBodyDecoded);

        await editor.exec(`chmod +x ./scripts/${script}`)
        await editor.exec(command)

        res.status(200).json({code: 0, params: editor.params || {}})
    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

/**
 * USERS ROUTES
 */

router.post("/ocserv/users/add", auth, async (req, res) => {
    try {

        const {username, password, group, client_id} = req.body
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const user = await Users.findOne({username,password})
        if(!user){
            const newUser = new Users({
                client_id: client_id || null,
                username,
                password,
                hashedPassword,
                group
            })

            await newUser.save()
        }

        const userEntry = `${username}:${group || "*"}:${hashedPassword}\n`;

        fss.appendFileSync(process.env.OCSERV_PASS_PATH, userEntry);

        const users = await new OcctlExec().users()
        const usersFile = fss.readFileSync(process.env.OCSERV_PASS_PATH, 'utf8').split("\n")
        return res.status(200).json({code: 0, users,usersFile});

    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

router.post("/ocserv/users/sync", auth, async (req, res) => {
    try {

        const users = await Users.find({});
        let usersLine = ""
        if(users){
            for(const user of users){
                usersLine += `${user.username}:${user.group}:${user.hashedPassword}\n`
            }
        }

        await fs.writeFile(process.env.OCSERV_PASS_PATH, usersLine);

        return res.status(200).json({code: 0, users});

    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

router.post("/ocserv/users/upload", auth, async (req, res) => {
    try {

        const lines = await fs.readFile(process.env.OCSERV_PASS_PATH, "utf8")
        const linesArray = lines.split("\n")
        if(linesArray && linesArray.length>0){
            for(const u of linesArray){
                const userArray = u.split(":")
                if(u !== "" && userArray.length >1){
                    const user = await Users.findOne({username: userArray[0],hashedPassword: userArray[2]})
                    if(!user){
                        const newUser = new Users({
                            client_id: null,
                            username: userArray[0],
                            password:"undefined",
                            hashedPassword: userArray[2],
                            enabled: true,
                            group: userArray[1]
                        })

                        await newUser.save()
                    }
                }
            }
        }

        return res.status(200).json({code: 200});

    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

router.get("/server/speed-test", auth, async (req, res) => {
    try {

        const st = await speedTest({acceptLicense: true});

        return res.status(200).json({code: 0, st});

    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

module.exports = router
