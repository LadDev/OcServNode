const Users = require("../models/Users");
const UsersOnline = require("../models/UsersOnline");
const {config} = require('dotenv');
const mongoose = require("mongoose");
//const fs = require('fs-extra');
config({path: "/root/OcServNode/api/.env"});
const OcctlExec = require("../classes/OcctlExec.class");

(async () => {
    //await fs.writeFile("/root/OcServNode/api/scripts/connect.log.txt", [...process.env, "hello world"].join("\n"));


    mongoose.set('strictQuery', false);
    await mongoose.connect("mongodb+srv://coincopytradingio:nTwVqDQrrA7hpnNV@tglab.ffyaxfd.mongodb.net/app?retryWrites=true&w=majority", {
        useUnifiedTopology: true,
    })

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
        // const user = await Users.findOne({username: USERNAME, enabled: true})
        // if (user) {
        //
        // }
        const uo = await UsersOnline.findOne({userName: USERNAME, invocationId: INVOCATION_ID})
        if (uo) {
            uo.statsBytesIn = STATS_BYTES_IN
            uo.statsBytesOut = STATS_BYTES_OUT
            uo.status = "disconnect"
            uo.disconnectAt = new Date().toISOString()
            await uo.save()
        }
        process.exit(0)
    }
    process.exit(1)

})();
