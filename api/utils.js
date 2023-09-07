const os  = require("os");
const { version } = require('./package.json');
const OcctlExec = require("./classes/OcctlExec.class");
const Nodes = require("./models/Nodes");
const EditorConf = require("./classes/editor.conf");
const fs = require("fs");
const axios = require("axios");
const {config} = require("dotenv");
const editor = new EditorConf();

const getStatus = async () => {
    const uuid = process.env.UUID;

    const status = await getStatusData()

    const node = await Nodes.findOne({ uuid });
    if (!node) {
        node.status = status;
        await node.save();
    }

    return status;
};

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

async function getCurrentIP() {
    const response = await axios.get('https://ifconfig.me');
    return response.data;
}

async function updateOrInsertNode(interfaces, status) {
    const uuid = process.env.UUID;
    const commonFields = {
        uuid,
        ip: await getCurrentIP(),
        hostname: os.hostname(),
        interfaces,
        status,
        version,
        apiKey: process.env.API_KEY,
        port: process.env.API_PORT || 10080,
    };

    let node = await Nodes.findOne({ uuid });

    if (!node) {
        node = new Nodes(commonFields);
        await node.save();
        updateEnvVariable("GLOBAL_IP", commonFields.ip);
        config();
    } else {
        Object.assign(node, commonFields);
        await node.save();
    }
}

async function setScriptPermissions() {
    const scriptPaths = [
        "scripts/connect-script.sh",
        "scripts/disconnect-script.sh",
        "scripts/user_connect.js",
        "scripts/user_disconnect.js"
    ];

    for (const path of scriptPaths) {
        try {
            await editor.exec(`chmod +x ${path}`);
        } catch (e) {
            console.error(e);
        }
    }
}

async function getStatusData() {
    const [cpuUsage, diskUsage, distro] = await Promise.all([
        editor.getCpuUsage(),
        editor.getDiskUsage(),
        editor.getLinuxDistro()
    ]);

    let occtlStatus = await new OcctlExec().status();
    if (occtlStatus === {}) occtlStatus = null;

    return {
        cpuUsage,
        diskUsage,
        platform: os.platform(),
        distro,
        freemem: os.freemem(),
        totalmem: os.totalmem(),
        occtlStatus,
        version,
        uuid: process.env.UUID
    };
}



module.exports = {getStatus, updateEnvVariable, getCurrentIP, updateOrInsertNode, setScriptPermissions, getStatusData}
