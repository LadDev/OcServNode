const Users = require("../models/Users");
const UsersOnline = require("../models/UsersOnline");
const {config} = require('dotenv');
const DIR = `${__dirname}`.replace("/scripts","")
config({path: `${DIR}/.env`});
const {dbConnect} = require("../db.connector");
const OcctlExec = require("../classes/OcctlExec.class");
const Nodes = require("../models/Nodes");
const PurchasedSubscription = require("../models/PurchasedSubscription");
const Subscriptions = require("../models/Subscriptions");
const Clients = require("../models/Clients");
const mongoose = require("mongoose");
const {Types} = require("mongoose");

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
        }
    }


    if (USERNAME) {
        let sess = null
        let fullSess = null
        let tlsciphersuite = null

        const usersConnected = await new OcctlExec().users()
        if (usersConnected) {
            for (const uc of usersConnected) {
                if (Number(uc.id) === Number(ID)) {
                    sess = uc.session
                    fullSess = uc.fullsession
                    tlsciphersuite = uc.tlsciphersuite
                    break;
                }
            }
        } else {
            process.exit(0)
        }

        const user = await Users.findOne({username: USERNAME, enabled: true})
        if (user) {

            try{
                if(user.client_id){

                    const purchased = await PurchasedSubscription.findOne({client_id: user.client_id, activated: true, expired: false})
                    if(!purchased){
                        const purchasedNew = await PurchasedSubscription.findOne({client_id: user.client_id, activated: false, expired: false})
                        if(purchasedNew){
                            const now = new Date();
                            const twoDaysLater = new Date(now);
                            twoDaysLater.setDate(now.getDate() + Number(purchasedNew.period));
                            purchasedNew.activated = true
                            purchasedNew.startDate = now.toISOString()
                            purchasedNew.endDate = twoDaysLater.toISOString()
                            await purchasedNew.save()

                            const findSubscr = await Subscriptions.findOne({_id: purchasedNew.subscrId})
                            if(findSubscr){
                                user.group = findSubscr.group
                                await user.save()

                                if(user.client_id){
                                    const client = await Clients.findOne({_id: user.client_id})
                                    if(client){
                                        client.group = findSubscr.group
                                        await client.save()
                                        await Users.updateMany({client_id: new Types.ObjectId(client.id)}, {$set: {group: findSubscr.group}})
                                    }
                                }
                            }

                        }
                    }
                }
            }catch (e) {

            }


            const uo = await UsersOnline.findOne({userName: USERNAME, invocationId: INVOCATION_ID, sesId: null})
            if (uo) {
                uo.uid = user.id
                uo.sesId = Number(ID)
                uo.groupName = GROUPNAME
                uo.userName = USERNAME
                uo.invocationId = INVOCATION_ID
                uo.uuid = process.env.UUID
                uo.device = DEVICE
                uo.remoteIp = IP_REAL
                uo.ipv4 = IP_REMOTE
                uo.vhost = VHOST
                uo.localDeviceIp = IP_REAL_LOCAL
                uo.session = sess
                uo.fullSession = fullSess
                uo.tlsCiphersuite = tlsciphersuite
                uo.status = "connect"
                uo.connectAt = new Date().toISOString()
                uo.disconnectAt = null
                await uo.save()
            } else {
                const uoNew = new UsersOnline({
                    uid: user.id,
                    sesId: Number(ID),
                    userName: USERNAME,
                    groupName: GROUPNAME,
                    invocationId: INVOCATION_ID,
                    uuid: process.env.UUID,
                    device: DEVICE,
                    remoteIp: IP_REAL,
                    ipv4: IP_REMOTE,
                    vhost: VHOST,
                    localDeviceIp: IP_REAL_LOCAL,
                    status: "connect",
                    session: sess,
                    fullSession: fullSess,
                    tlsCiphersuite: tlsciphersuite,
                    connectAt: new Date().toISOString()
                });

                await uoNew.save()
            }
            try{
                const node = await Nodes.findOne({uuid: process.env.UUID})
                if(node && node.status && node.status.occtlStatus && node.status.occtlStatus !== {}){
                    node.status.occtlStatus.activesessions = usersConnected.length
                    node.status.occtlStatus.totalsessions = usersConnected.length
                    await node.save()
                }
            }catch (e){}

            process.exit(0)
        }
    }
    process.exit(1)

})();
