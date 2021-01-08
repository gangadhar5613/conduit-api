const mongoose = require('mongoose');
const { schema } = require('./User');
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);

const Schema = mongoose.Schema;

const articleSchema = new Schema({
    slug:{type:String,slug:'title'},
    title:{type:String,required:true},
    description:{type:String,required:true},
    body:{type:String},
    tagList:[{type:String}],
    favorited:{type:Boolean,default:false},
    favoritesCount:{type:Number,default:0},
    author:{type:Schema.Types.ObjectId,ref:'User'},
    comments:[{type:Schema.Types.ObjectId,ref:'Article'}]
},{timestamps:true});


const Article = mongoose.model('Article',articleSchema);

module.exports = Article;
