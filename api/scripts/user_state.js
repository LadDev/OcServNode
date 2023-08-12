const {Router} = require("express")
const router = Router()
const EditorConf = require("../classes/editor.conf");
const auth = require("../middleware/auth.middleware");
const fs = require("fs-extra");
const fss = require("fs");
const os = require("os");
const OcctlExec = require("../classes/OcctlExec.class");
const editor = new EditorConf();
const { version } = require('../package.json');
const bcrypt = require('bcrypt');
const Users = require("../models/Users");

console.log(process.argv)

process.exit(0);
