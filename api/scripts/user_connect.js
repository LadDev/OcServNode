const Users = require("../models/Users");
const UsersOnline = require("../models/UsersOnline");
const { config } = require('dotenv');
const mongoose = require("mongoose");
const fs = require('fs-extra');
config({path: "../.env"});
fs.writeFile("/root/OcServNode/api/scripts/connect.log.txt", [...process.argv, "hello world"].join("\n"));
(async () => {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.DATABASE, {
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
    for(const arg of process.argv){
        const argArrTmp = arg.split("=")
        if(argArrTmp[0].startsWith("INVOCATION_ID")){
            INVOCATION_ID = argArrTmp[1]
        }else if(argArrTmp[0].startsWith("USERNAME")){
            USERNAME = argArrTmp[1]
        }else if(argArrTmp[0].startsWith("GROUPNAME")){
            GROUPNAME = argArrTmp[1]
        }else if(argArrTmp[0].startsWith("DEVICE")){
            DEVICE = argArrTmp[1]
        }else if(argArrTmp[0].startsWith("IP_REAL")){
            IP_REAL = argArrTmp[1]
        }else if(argArrTmp[0].startsWith("IP_REMOTE")){
            IP_REMOTE = argArrTmp[1]
        }else if(argArrTmp[0].startsWith("ID")){
            ID = argArrTmp[1]
        }else if(argArrTmp[0].startsWith("VHOST")){
            VHOST = argArrTmp[1]
        }else if(argArrTmp[0].startsWith("IP_REAL_LOCAL")){
            IP_REAL_LOCAL = argArrTmp[1]
        }
    }



    if(USERNAME){
        const user = await Users.findOne({username: USERNAME, enabled: true})
        if(user){
            const uo = await UsersOnline.findOne({userName: USERNAME,invocationId: INVOCATION_ID})
            if(uo){
                uo.sesId = ID
                uo.groupName = GROUPNAME
                uo.userName = USERNAME
                uo.invocationId = INVOCATION_ID
                uo.uuid = process.env.UUID
                uo.device = DEVICE
                uo.remoteIp = IP_REAL
                uo.ipv4 = IP_REMOTE
                uo.vhost = VHOST
                uo.localDeviceIp = IP_REAL_LOCAL
                uo.status = "connect"
                await uo.save()
            }else{
                const uoNew = new UsersOnline({
                    sesId: ID,
                    userName: USERNAME,
                    groupName: GROUPNAME,
                    invocationId: INVOCATION_ID,
                    uuid: process.env.UUID,
                    device: DEVICE,
                    remoteIp: IP_REAL,
                    ipv4: IP_REMOTE,
                    vhost: VHOST,
                    localDeviceIp: IP_REAL_LOCAL,
                    status: "connect"
                });

                await uoNew.save()
            }
            process.exit(0)
        }
    }
    process.exit(1)

})();
