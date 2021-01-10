const jwt = require('jsonwebtoken');

const User = require('../models/User');



exports.generateJwt = async (user) => {
    const payload = {userId:user.id,email:user.email};
    const token = await jwt.sign(payload,process.env.SECRET);
    return token;
}

exports.verifyToken = async (req,res,next) => {
const token = req.headers.authorization;
 if(token){
     try {
         const payload = await jwt.verify(token,process.env.SECRET);
         req.user = payload;
         next()
     } catch (error) {
         next(error);
     }
 }else{
     res.status(401).json({message:'Authentication required'});
 }

}