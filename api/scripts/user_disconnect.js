const UsersOnline = require("../models/UsersOnline");
const {config} = require('dotenv');
const Sessions = require("../models/Sessions");
const DIR = `${__dirname}`.replace("/scripts", "")
config({path: `${DIR}/.env`});
const {dbConnect} = require("../db.connector");
const Nodes = require("../models/Nodes");

(async () => {
    await dbConnect()

    let USERNAME = null
    let INVOCATION_ID = null
    let GROUPNAME = null
    let DEVICE = null
    let IP_REAL = null
    let IP_REMOTE = null
    let IP_REAL_LOCAL = null
    let ID = null
    let VHOST = null
    let STATS_BYTES_OUT = 0
    let STATS_BYTES_IN = 0
    for (const arg of process.argv) {
        const argArrTmp = arg.split("=")
        if (argArrTmp[0].startsWith("INVOCATION_ID")) {
            INVOCATION_ID = argArrTmp[1]
        } else if (argArrTmp[0].startsWith("USERNAME")) {
            USERNAME = argArrTmp[1]
        } else if (argArrTmp[0].startsWith("GROUPNAME")) {
            GROUPNAME = argArrTmp[1]
        } else if (argArrTmp[0].startsWith("DEVICE")) {
            DEVICE = argArrTmp[1]
        } else if (argArrTmp[0].startsWith("IP_REAL")) {
            IP_REAL = argArrTmp[1]
        } else if (argArrTmp[0].startsWith("IP_REMOTE")) {
            IP_REMOTE = argArrTmp[1]
        } else if (argArrTmp[0].startsWith("ID")) {
            ID = argArrTmp[1]
        } else if (argArrTmp[0].startsWith("VHOST")) {
            VHOST = argArrTmp[1]
        } else if (argArrTmp[0].startsWith("IP_REAL_LOCAL")) {
            IP_REAL_LOCAL = argArrTmp[1]
        } else if (argArrTmp[0].startsWith("STATS_BYTES_OUT")) {
            STATS_BYTES_OUT = argArrTmp[1]
        } else if (argArrTmp[0].startsWith("STATS_BYTES_IN")) {
            STATS_BYTES_IN = argArrTmp[1]
        }
    }


    if (USERNAME && INVOCATION_ID) {
        const uo = await UsersOnline.findOne({sesId:Number(ID), userName: USERNAME, invocationId: INVOCATION_ID})
        if (uo) {
            uo.statsBytesIn = Number(STATS_BYTES_IN)+uo.statsBytesIn
            uo.statsBytesOut = Number(STATS_BYTES_OUT)+uo.statsBytesOut
            uo.status = "disconnect"
            uo.sesId = null
            uo.disconnectAt = new Date().toISOString()
            await uo.save()

            const sessionDB = await Sessions.findOne({uuid: uo.uuid, uid: uo.uid,userName: uo.userName, session: uo.session, fullSession: uo.fullSession});
            sessionDB.connected = false
            sessionDB.closed = new Date().toISOString()
            sessionDB.statsBytesIn = Number(STATS_BYTES_IN)
            sessionDB.statsBytesOut = Number(STATS_BYTES_OUT)
            await sessionDB.save()
        }

        try{
            const node = await Nodes.findOne({uuid: process.env.UUID})
            if(node && node.status && node.status.occtlStatus && node.status.occtlStatus !== {}){
                if(node.status.occtlStatus.activesessions > 0) {
                    node.status.occtlStatus.activesessions -= 1
                }
                if(node.status.occtlStatus.totalsessions > 0) {
                    node.status.occtlStatus.totalsessions -= 1
                }
                await node.save()
            }
        }catch (e){}

        process.exit(0)
    }
    process.exit(1)

})();
