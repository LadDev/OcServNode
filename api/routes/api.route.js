const {Router} = require("express")
const router = Router()
const EditorConf = require("../classes/editor.conf");
const auth = require("../middleware/auth.middleware");
const fsp = require('fs').promises;
const OcctlExec = require("../classes/OcctlExec.class");
const editor = new EditorConf();
const bcrypt = require('bcrypt');
const Users = require("../models/Users");
const speedTest = require('speedtest-net');
const {getStatus} = require("../utils");
const fs = require("fs-extra");
const CERTS_PATH = "/var/certs/";

(async () => {
    await editor.read(process.env.OCSERV_CONF_PATH)
})();

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
        const { out } = await editor.exec("ip -j -s addr | jq");

        if (!out) {
            return res.status(500).json({ code: -1, message: "Failed to retrieve interface data." });
        }

        let interfacesJSON;
        try {
            interfacesJSON = JSON.parse(out);
        } catch (error) {
            console.error("Error while parsing JSON:", error);
            return res.status(500).json({ code: -1, message: "Error in processing interface data." });
        }

        const interfaces = interfacesJSON.filter(interf =>
            interf.ifname &&
            interf.ifname !== "lo" &&
            !interf.ifname.startsWith("vpns")
        );

        res.status(200).json({ code: 0, interfaces });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: -1, message: "Something went wrong, please try again." });
    }
});

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

        const confText = await fs.readFile(process.env.OCSERV_CONF_PATH, 'utf8')

        res.status(200).json({code: 0, params,confText})
    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

router.post("/configs", auth, async (req, res) => {
    try {

        const {conf,type} = req.body

        console.info("Save Config", req.body)

        if(conf && type && type === "plain/text"){

            await fs.writeFile(process.env.OCSERV_CONF_PATH, conf, 'utf-8');
            await editor.exec("service ocserv restart")
        }


        await editor.read(process.env.OCSERV_CONF_PATH)
        let params = {...editor.params}
        delete params.commented

        const confText = await fs.readFile(process.env.OCSERV_CONF_PATH, 'utf8')

        res.status(200).json({code: 0, params,confText})
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
        const { command } = req.params;
        let mess = "";

        const commandMappings = {
            "start": "service ocserv start",
            "restart": "service ocserv restart",
            "stop": ["occtl stop now", "service ocserv stop"],
            "reload": "occtl reload",
            "reset": "occtl reset"
        };

        if (commandMappings[command]) {
            if (Array.isArray(commandMappings[command])) {
                for (const cmd of commandMappings[command]) {
                    const { out } = await editor.exec(cmd);
                    mess += out;
                }
            } else {
                const { out } = await editor.exec(commandMappings[command]);
                mess = out;
            }
        } else {
            throw new Error(`Invalid command: ${command}`);
        }

        res.status(200).json({ code: 0, message: mess, status: await getStatus() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: -1, message: "Something went wrong, please try again" });
    }
});

router.post("/configs/cerificates", auth, async (req, res) => {
    try {
        const { privkey, ca_bundle, certificate, fullchain } = req.body;

        await editor.exec("service ocserv stop");

        // Creating directory, ignore error if directory already exists
        try {
            await editor.exec(`mkdir -p ${CERTS_PATH}`);
        } catch (e) {
            console.error(e);
        }

        let fullchainString = "";

        // Validate and handle certificate data
        if (fullchain && privkey) {
            fullchainString = Buffer.from(fullchain, 'base64').toString('utf8');
        } else if (ca_bundle && certificate && privkey) {
            const ca_bundleString = Buffer.from(ca_bundle, 'base64').toString('utf8');
            const certificateString = Buffer.from(certificate, 'base64').toString('utf8');
            fullchainString = `${certificateString}${ca_bundleString}`;
        } else {
            return res.status(500).json({ code: -1, message: "Error in Certs Data" });
        }

        const privkeyString = Buffer.from(privkey, 'base64').toString('utf8');

        try {
            await fsp.writeFile(`${CERTS_PATH}privkey.pem`, privkeyString);
            await fsp.writeFile(`${CERTS_PATH}fullchain.pem`, fullchainString);
        } catch (e) {
            console.error(e);
            return res.status(500).json({ code: -1, message: "Error in Certs Data" });
        }

        await editor.setParam("server-cert", `${CERTS_PATH}fullchain.pem`);
        await editor.setParam("server-key", `${CERTS_PATH}privkey.pem`);

        await editor.exec("service ocserv start");

        res.status(200).json({ code: 0, params: editor.params });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: -1, message: "Something went wrong, please try again" });
    }
});

router.post("/exec/:script", auth, async (req, res) => {
    try {
        const { script } = req.params;
        const { scriptBody, command } = req.body;

        // Some basic input validation. This can be expanded.
        if (typeof script !== 'string' || script.includes("..") || script.includes("/") || typeof scriptBody !== 'string' || typeof command !== 'string') {
            return res.status(200).json({ code: 400, message: "Invalid input." });
        }

        // Decode the scriptBody
        let scriptBodyDecoded = Buffer.from(scriptBody, 'base64').toString('utf8');

        // Write the decoded script to a file
        await fsp.writeFile(`./scripts/${script}`, scriptBodyDecoded);

        // Make the script executable
        await editor.exec(`chmod +x ./scripts/${script}`);

        // You should be VERY careful about this. Ideally, this should not be done.
        // It is highly recommended to not execute a command directly from user input.
        // If you must, ensure that command is rigorously validated.
        await editor.exec(command);

        res.status(200).json({ code: 0, params: editor.params || {} });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: -1, message: "Something went wrong, please try again" });
    }
});

/**
 * USERS ROUTES
 */

router.post("/ocserv/users/add", auth, async (req, res) => {
    try {
        const { username, password, group, client_id } = req.body;

        const existingUser = await Users.findOne({ username });

        if (!existingUser) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new Users({
                client_id: client_id || null,
                username,
                password,
                hashedPassword,
                group: group || "*"
            });

            await newUser.save();

            const userEntry = `${username}:${group || "*"}:${hashedPassword}\n`;
            await fsp.appendFile(process.env.OCSERV_PASS_PATH, userEntry);
        }

        const users = await new OcctlExec().users();
        const usersFile = await fsp.readFile(process.env.OCSERV_PASS_PATH, 'utf8');

        return res.status(200).json({ code: 0, users, usersFile: usersFile.split("\n") });

    } catch (error) {
        console.error(error);
        res.status(500).json({ code: -1, message: "Something went wrong, please try again" });
    }
});

router.post("/ocserv/users/upload", auth, async (req, res) => {
    try {

        const lines = await fsp.readFile(process.env.OCSERV_PASS_PATH, "utf8");
        const linesArray = lines.split("\n");

        const promises = linesArray.map(async (line) => {
            const [username, group, hashedPassword] = line.split(":");

            // Ensure that the line has valid user details.
            if (username && group && hashedPassword) {
                const user = await Users.findOne({ username, hashedPassword });

                if (!user) {
                    const newUser = new Users({
                        client_id: null,
                        username,
                        password: "undefined",
                        hashedPassword,
                        enabled: true,
                        group
                    });

                    return newUser.save();
                }
            }
        });

        // Wait for all promises to finish
        await Promise.all(promises);

        return res.status(200).json({ code: 200 });

    } catch (error) {
        console.error(error);
        res.status(500).json({ code: -1, message: "Something went wrong, please try again" });
    }
});

router.post("/ocserv/users/sync", auth, async (req, res) => {
    try {

        const usersDB = await Users.find({});

        const newUserFile = usersDB.map(user => `${user.username}:${user.group}:${user.hashedPassword}`);

        await fsp.writeFile(process.env.OCSERV_PASS_PATH, newUserFile.join("\n"));

        return res.status(200).json({code: 200});

    } catch (error) {
        console.error(error);
        res.status(500).json({code: -1, message: "Something went wrong, please try again"});
    }
});

router.post("/ocserv/groups/sync", auth, async (req, res) => {

    try {
        const { conf, groupName, forSubscr } = req.body;

        const pathToFile = `/var/ocserv/groups/${groupName}`;

        if (forSubscr) {
            const confArray = conf.split("\n");

            for (const c of confArray) {
                if (c.startsWith("ipv4-network")) {
                    const ipData = c.split("=");
                    await editor.exec(`iptables -t nat -A POSTROUTING -s ${ipData[1].trim()} -o eth0 -j MASQUERADE; iptables -A FORWARD -s ${ipData[1].trim()} -j ACCEPT; iptables -A FORWARD -d ${ipData[1].trim()} -j ACCEPT`);
                }
            }

            try {
                await fsp.access(pathToFile);
                console.log('Файл существует, перезаписываем...');
            } catch (error) {
                console.log('Файл не существует, создаем и записываем...');
            }

            try {
                await fsp.writeFile(pathToFile, conf);
                console.log('Файл успешно записан/перезаписан!');
            } catch (error) {
                console.error('Ошибка при записи файла:', error);
            }

            await editor.exec("service ocserv restart");
        }

        return res.status(200).json({code: 200});
    } catch (error) {
        console.error(error);
        res.status(500).json({code: -1, message: "Something went wrong, please try again"});
    }
});

router.get("/server/speed-test", auth, async (req, res) => {
    try {

        const st = await speedTest({acceptLicense: true});

        return res.status(200).json({code: 0, st});

    } catch (error) {
        console.error(error)
        res.status(500).json({code: -1, message: "Something went wrong, please try again"})
    }
})

router.post("/ocserv/users/disconnect-by-id", auth, async (req, res) => {
    try {
        const {id} = req.body;
        const ids = Array.isArray(id) ? id : [id];  // Гарантируем, что ids является массивом.

        const disconnectPromises = ids.map(i => new OcctlExec().disconnectUser(i));
        await Promise.all(disconnectPromises);

        return res.status(200).json({code: 0});
    } catch (error) {
        console.error(error);
        res.status(500).json({code: -1, message: "Something went wrong, please try again"});
    }
});

router.post("/ocserv/users/disconnect-by-usernames", auth, async (req, res) => {
    try {
        const {userNames = []} = req.body;

        const disconnectPromises = userNames.map(un => new OcctlExec().disconnectUserByName(un));
        await Promise.all(disconnectPromises);

        return res.status(200).json({code: 0});
    } catch (error) {
        console.error(error);
        res.status(500).json({code: -1, message: "Something went wrong, please try again"});
    }
});

module.exports = router
