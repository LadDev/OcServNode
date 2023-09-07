const UsersOnline = require("../models/UsersOnline");
const { config } = require('dotenv');
const Sessions = require("../models/Sessions");
const { dbConnect } = require("../db.connector");
const Nodes = require("../models/Nodes");

const DIR = `${__dirname}`.replace("/scripts", "");
config({ path: `${DIR}/.env` });

(async () => {
    await dbConnect();

    const argMap = {};
    process.argv.forEach(arg => {
        const [key, value] = arg.split("=");
        argMap[key] = value;
    });

    const {
        USERNAME,
        INVOCATION_ID,
        ID,
        STATS_BYTES_OUT = 0,
        STATS_BYTES_IN = 0
    } = argMap;

    if (USERNAME && INVOCATION_ID) {
        const uo = await UsersOnline.findOne({ sesId: Number(ID), userName: USERNAME, invocationId: INVOCATION_ID });
        if (uo) {
            Object.assign(uo, {
                statsBytesIn: Number(STATS_BYTES_IN) + uo.statsBytesIn,
                statsBytesOut: Number(STATS_BYTES_OUT) + uo.statsBytesOut,
                status: "disconnect",
                sesId: null,
                disconnectAt: new Date().toISOString()
            });
            await uo.save();

            const sessionDB = await Sessions.findOne({ uuid: uo.uuid, uid: uo.uid, userName: uo.userName, session: uo.session, fullSession: uo.fullSession });
            Object.assign(sessionDB, {
                connected: false,
                session_is_open: 0,
                in_use: 0,
                closed: new Date().toISOString(),
                statsBytesIn: Number(STATS_BYTES_IN),
                statsBytesOut: Number(STATS_BYTES_OUT)
            });
            await sessionDB.save();
        }

        try {
            const node = await Nodes.findOne({ uuid: process.env.UUID });
            if (node && node.status && node.status.occtlStatus) {
                node.status.occtlStatus.activesessions = Math.max(node.status.occtlStatus.activesessions - 1, 0);
                node.status.occtlStatus.totalsessions = Math.max(node.status.occtlStatus.totalsessions - 1, 0);
                await node.save();
            }
        } catch (e) { /* handle error if necessary */ }

        process.exit(0);
    }
    process.exit(1);
})();
