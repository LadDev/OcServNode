let auth = async (req, res, next) =>{
    if(req.method === "OPTIONS"){
        return next()
    }

    try{

        const token = req.headers["authorization"].split(' ')[1] // "Bearer TOKEN"

        if(!token){
            return res.status(401).json({code: -1, message: "Authenticate required"})
        }

        try{
            if(process.env.API_KEY !== token){
                return res.status(400).json({code: -2, message: "User not found"});
            }

            next()
        }catch (e) {
            return res.status(401).json({code: -1, message: "Invalid API token"})
        }

    }catch (e){
        return res.status(401).json({code: -1, message: "Authenticate required"})
    }
}

module.exports = auth
