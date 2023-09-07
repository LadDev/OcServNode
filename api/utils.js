import os from "os";
const { version } = require('./package.json');
import OcctlExec from "./classes/OcctlExec.class";
import Nodes from "./models/Nodes";
import EditorConf from "./classes/editor.conf";
const editor = new EditorConf();

const getStatus = async () => {
    const [cpuUsage, diskUsage, distro] = await Promise.all([
        editor.getCpuUsage(),
        editor.getDiskUsage(),
        editor.getLinuxDistro()
    ]);

    const platform = os.platform();
    const freemem = os.freemem();
    const totalmem = os.totalmem();

    let occtlStatus = await new OcctlExec().status();
    if (!Object.keys(occtlStatus).length) occtlStatus = null;

    const uuid = process.env.UUID;

    const status = {
        cpuUsage,
        diskUsage,
        platform,
        distro,
        freemem,
        totalmem,
        occtlStatus,
        version,
        uuid
    };

    const node = await Nodes.findOne({ uuid });
    if (!node) {
        node.status = status;
        await node.save();
    }

    return status;
};


module.exports = {getStatus}
