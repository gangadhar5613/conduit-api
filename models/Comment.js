const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentSchema = new Schema({
    body:{type:String,required:true},
    author:{type:Schema.Types.ObjectId,required:true ,ref:'User'}
},{timestamps:true});


const Comment = mongoose.model('Comment',commentSchema);

module.exports = Comment;