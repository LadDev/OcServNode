const fs = require('fs-extra');
const fss = require('fs');
const { exec } = require('child_process');
const {check} = require("diskusage");
const {cpuUsage} = require("os-utils");

class EditorConf {

    filePath = null
    fileContent = null

    params = {
        commented: {}
    }

    constructor() {
    }

    read = async (path) => {
        try{
            this.filePath = path
            this.params = {commented:{}}
            this.fileContent = await fs.readFile(path, 'utf8');

            const lines = this.fileContent.split('\n');

            lines.map(line => {
                if (line[0] !== "#" && line[0]) {
                    this._setParams(line)
                }else if (line[0] && line[0] === "#" && !line.startsWith("#  ")) {
                    if(line.includes(" = ")){
                        const result = line.replace(/^#/, '');
                        this._setCommentParams(result)
                    }
                }
            });
        }catch (e) {
            console.error(e)
        }
    }

    create = async (config) => {
        try{
            try {
                if(fss.existsSync(process.env.OCSERV_CONF_PATH)){
                    const time = Date.now()
                    await fss.rename(process.env.OCSERV_CONF_PATH, `${process.env.OCSERV_CONF_PATH}.${time}.back`, ()=>{})
                }
            }catch (e) {
                console.error(e)
            }

            let lines = ""

            for(const key in config){
                if (config.hasOwnProperty(key)) { // Дополнительная проверка, чтобы удостовериться, что свойство принадлежит самому объекту, а не его прототипу
                    if (Array.isArray(config[key])) {
                        for(const value of config[key]){
                            lines += await this._typer(key,value)
                        }
                    }else{
                        lines += await this._typer(key,config[key])
                    }
                }
            }

            await fs.writeFile(this.filePath, lines);
            await this.read(this.filePath)

        }catch (e) {
            console.error(e)
        }
    }

    exec = async (command) => {
       return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject({error,stderr})
                    console.error(`exec error: ${error}`);
                    console.error(`${stderr}`);
                    return;
                }
                resolve({out:stdout,error:stderr})
            });
        })


    }

    _typer = async (key, value) => {
        if(typeof value === "boolean"){
            return `${key} = ${value}\n`
        }else if(typeof value === "string" && isNaN(Number(value))){
            return `${key} = "${value}"\n`
        }else if(typeof value === "number" || !isNaN(Number(value))){
            return `${key} = ${Number(value)}\n`
        }

        return ""
    }

    setParam = async (key, value) => {
        this.params[key] = value

        await this.uncommentParam(key)

        const lines = this.fileContent.split('\n');
        let counter = 0
        const newLines = lines.map(line => {
            if (line.startsWith(key)) {

                if(Array.isArray(value)){
                    if(value.length>counter){
                        const nl = `${key} = ${value[counter]}`
                        counter += 1
                        return nl;
                    }else{
                        return `#${line}`;
                    }


                }else{
                    return `${key} = ${value}`;
                }
            }else if(counter > 0 && value.length>counter){

                let nl = ""
                new Promise((resolve) => {
                    for (counter; counter < value.length; counter++){
                        if(value[counter]){
                            nl += `${key} = ${value[counter]}\n`
                        }
                    }
                    resolve(0);
                })

                return `${nl}${line}`;
            }
            return line;
        });

        await fs.writeFile(this.filePath, newLines.join('\n'));
        await this.read(this.filePath)
    }

    commentParam = async (key) => {
        const lines = this.fileContent.split('\n');

        const newLines = lines.map(line => {
            if (line.startsWith(key)) {
                return `#${line}`;
            }
            return line;
        });

        await fs.writeFile(this.filePath, newLines.join('\n'));
        await this.read(this.filePath)
    }

    uncommentParam = async (key) => {
        const lines = this.fileContent.split('\n');

        const newLines = lines.map(line => {
            if (line.startsWith(`#${key}`)) {
                return line.replace(/^#/, '');
            }
            return line;
        });

        await fs.writeFile(this.filePath, newLines.join('\n'));
        await this.read(this.filePath)
    }

    _setParams(line){
        try{
            const keyVal = line.split("=")
            const key = keyVal[0].trim()
            let val = keyVal[1].trim().replace(/^"|"$/g, '')
            if(keyVal.length > 2){
                val = keyVal.slice(1).join('=').trim().replace(/^"|"$/g, '')
            }

            if(val === "false"){
                val = false
            }else if(val === "true"){
                val = true
            }

            if(key in this.params){
                if(Array.isArray(this.params[key])){
                    this.params[key].push(val)
                }else{
                    const tmpKey = this.params[key]
                    this.params[key] = []
                    this.params[key].push(tmpKey)
                    this.params[key].push(val)
                }

            }else{
                this.params[key] = val
            }
        }catch (e) {
            console.log(line)
            console.error(e)
        }
    }

    _setCommentParams(line){
        try{
            const keyVal = line.split("=")
            const key = keyVal[0].trim()
            let val = keyVal[1].trim().replace(/^"|"$/g, '')
            if(keyVal.length > 2){
                val = keyVal.slice(1).join('=').trim().replace(/^"|"$/g, '')
            }

            if(val === "false"){
                val = false
            }else if(val === "true"){
                val = true
            }

            if(key in this.params.commented){
                if(Array.isArray(this.params.commented[key])){
                    this.params.commented[key].push(val)
                }else{
                    const tmpKey = this.params.commented[key]
                    this.params.commented[key] = []
                    this.params.commented[key].push(tmpKey)
                    this.params.commented[key].push(val)
                }
            }else{
                this.params.commented[key] = val
            }
        }catch (e) {
            console.log(line)
            console.error(e)
        }
    }

    getDiskUsage = async () => {
        return new Promise((resolve, reject) => {
            const path = '/'; // Путь к диску, для которого вы хотите получить информацию

            check(path, function (err, info) {
                if (err) {
                    console.error(err);
                    reject(err)
                    return;
                }

                const total = info.total;
                const free = info.available;
                const used = total - free;
                const usagePercent = (used / total) * 100;

                resolve(Number(usagePercent.toFixed(2)));
            });
        });
    }

    getCpuUsage = async () => {
        return new Promise((resolve) => {
            cpuUsage(function (usage) {
                resolve(usage * 100);
            });
        });
    }

    getLinuxDistro = async () => {
        return new Promise((resolve) => {

            const response = {name: "unknown", version: "unknown", version_id:"unknown"}

            if (fs.existsSync('/etc/os-release')) {
                const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
                const lines = osRelease.split("\n")
                for(const line of lines){
                    const data = line.split("=")
                    if(line.startsWith("NAME=")){
                        response.name = data[1].trim().replace(/"/g, '')
                    }else if(line.startsWith("VERSION=")){
                        response.version = data[1].trim().replace(/"/g, '')
                    }else if(line.startsWith("VERSION_ID=")){
                        response.version_id = data[1].trim().replace(/"/g, '')
                    }
                }
            }

            resolve(response)
        });
    }
}

module.exports = EditorConf;
