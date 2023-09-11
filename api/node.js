const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const { config } = require('dotenv')
config()
const {dbConnect} = require("./db.connector")
const EditorConf = require("./classes/editor.conf");
const editor = new EditorConf();
const YAML = require("yamljs");
const swaggerUi = require('swagger-ui-express')
const {updateEnvVariable, getStatusData, updateOrInsertNode, setScriptPermissions} = require("./utils");



if(!process.env.UUID){
    const { v4: uuidv4 } = require('uuid');
    const uniqueId = uuidv4();
    updateEnvVariable("UUID", uniqueId)
    config()
}

const app = express();

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({limit: "500mb"}));
app.use(bodyParser.urlencoded({limit: "500mb", extended: true, parameterLimit:5000}));

app.use(function (req, res, next) {
    res.setHeader('X-Powered-By', 'LadDev Apps')
    next()
})

app.use("/api", require("./routes/api.route"))


const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))


const API_PORT = process.env.API_PORT || 10080

async function start() {
    try {
        await dbConnect();

        let interfaces = [];

        try {
            const interfacesTMP = await editor.exec("ip -j -s addr | jq");
            if (interfacesTMP.out) {
                const interfacesJSON = JSON.parse(interfacesTMP.out);
                interfaces = interfacesJSON.filter(interf => interf.ifname && interf.ifname !== "lo" && !interf.ifname.startsWith("vpns"));
            }
        } catch (e) {
            console.error(e);
        }

        const status = await getStatusData();


        await updateOrInsertNode(interfaces, status);
        await setScriptPermissions();

        app.listen(API_PORT, () => {
            console.info(`Server admin app has been started on port ${API_PORT}`);
        });
    } catch (e) {
        console.error("Server Error:", e.message);
        process.exit(0);
    }
}

start().then(()=>{})
