const Users = require("../models/Users");
const UsersOnline = require("../models/UsersOnline");
const { config } = require('dotenv');
const { dbConnect } = require("../db.connector");
const OcctlExec = require("../classes/OcctlExec.class");
const Nodes = require("../models/Nodes");
const PurchasedSubscription = require("../models/PurchasedSubscription");

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
        GROUPNAME,
        DEVICE,
        IP_REAL,
        IP_REMOTE,
        ID,
        VHOST,
        IP_REAL_LOCAL
    } = argMap;

    if (USERNAME) {
        let sess, fullSess, tlsciphersuite;

        const usersConnected = await new OcctlExec().users();
        const userConnection = usersConnected.find(uc => Number(uc.id) === Number(ID));
        if (userConnection) {
            ({ session: sess, fullsession: fullSess, tlsciphersuite } = userConnection);
        } else {
            process.exit(0);
        }

        const user = await Users.findOne({ username: USERNAME, enabled: true });

        if (user && user.client_id) {
            const purchased = await PurchasedSubscription.findOne({
                client_id: user.client_id,
                activated: true,
                expired: false
            });

            if (!purchased) {
                const purchasedNew = await PurchasedSubscription.findOne({
                    client_id: user.client_id,
                    activated: false,
                    expired: false
                });

                if (purchasedNew) {
                    const now = new Date();
                    const endDate = new Date(now.setDate(now.getDate() + Number(purchasedNew.period)));
                    Object.assign(purchasedNew, { activated: true, startDate: now, endDate });
                    await purchasedNew.save();
                }
            }
        }

        const commonFields = {
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
            session: sess,
            fullSession: fullSess,
            tlsCiphersuite,
            status: "connect",
            connectAt: new Date().toISOString()
        };

        let uo = await UsersOnline.findOne({ userName: USERNAME, invocationId: INVOCATION_ID, sesId: null });

        if (uo) {
            Object.assign(uo, commonFields, { disconnectAt: null });
            await uo.save();
        } else {
            const uoNew = new UsersOnline(commonFields);
            await uoNew.save();
        }

        try {
            const node = await Nodes.findOne({ uuid: process.env.UUID });
            if (node && node.status && node.status.occtlStatus) {
                node.status.occtlStatus.activesessions = usersConnected.length;
                node.status.occtlStatus.totalsessions = usersConnected.length;
                await node.save();
            }
        } catch (e) { /* handle error if necessary */ }

        process.exit(0);
    }
    process.exit(1);
})();

