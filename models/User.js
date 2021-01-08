const mongoose = require('mongoose');
const { stringify } = require('postcss');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;


const userSchema = new Schema({
    username: {type:String,required:true,unique:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    bio:{type:String},
    image:{type:String},
    following:[{type:String}],
    followers:[{type:String}]

},{timestamps:true});


userSchema.pre('save',function (next) {
    if(this.password){
       bcrypt.hash(this.password,12,(err,hash) => {
           if(err) return next();
           this.password = hash;
           next()
       })
    }else{
        next();
    }
})

userSchema.methods.verifyPassword = async function(password){
  return  await bcrypt.compare(password,this.password)
}


const User = mongoose.model('User',userSchema);

module.exports = User;