var express = require('express');
var router = express.Router();
const User = require('../models/User');
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const jwt = require('../module/token');

const mongooseSlugGenerator = require('mongoose-slug-generator');
const mongoose = require('mongoose');
const { findOne } = require('../models/User');



//show all the articles

router.get('/articles', async (req,res,next) => {
 
    console.log(req.query.user)
    const tag = req.query.tag;
    const author = req.query.author;
    const favoriteUser = req.query.favorited;
    const limit = req.query.limit || 20;
    const skip = req.query.offset || 0;
    const filters = {};
     const filteredArticles = [];
  
     try {
          if(tag){
              filters.tagList = tag;
              const articles = await Article.find({tagList: {$all : [tag]}}).sort({_id:-1}).populate('author')
              articles.forEach((article) => {
                  filteredArticles.push(articleView(article,profileView(article.author)))
              })
  
              if(author){
                  console.log(author)
                  const user = await User.findOne({username:author});
                  const articles = await Article.find({author:user._id}).sort({_id:-1}).populate('author');
                  articles.forEach((article) => {
                      filteredArticles.push(articleView(article,profileView(article.author)))
                  })
              }
      
              if(favoriteUser){
                  const user = await User.findOne({username:favoriteUser});
                  const articles = await Article.find({author:user.id}).sort({_id:-1}).populate('author');
                  articles.forEach((article) => {
                      filteredArticles.push(articleView(article,profileView(article.author)))
                  })
                  
              }
              res.json({articles:filteredArticles,articlesCount:filteredArticles.length})
               
  
          }else{
              const articles = await Article.find({}).sort({_id:-1}).populate('author');
              articles.forEach((article) => {
                  filteredArticles.push(articleView(article,profileView(article.author)))
              })
              res.json({articles:filteredArticles,articlesCount:filteredArticles.length})
          }
  
  
          
                  
     } catch (error) {
       next(error)  
     }
  
  })
  








//registering the user

router.post('/users', async (req,res,next) => {
  try {
      const user = await  User.create(req.body.user);
      const token = await jwt.generateJwt(user);
      user.token = token
      console.log(token);
    res.json({user:{...userInfo(user),token}})
  } catch (error) {
      next(error)
  }

})


//function to show userinfo
function userInfo(user){
 return {
  email:user.email,
  username:user.username,
  bio:user.bio,
  image:user.image,
 
 }
}



//login the user

router.post('/users/login',async (req,res,next) => {
  const {email,password} = req.body.user;
 try {
      if(email && password){
          const user = await User.findOne({email:email});
          if(user.verifyPassword(password)){
                  const token = await jwt.generateJwt(user);
                  
                  res.json({user:{...userInfo(user),token}});
          }
      }else{
          res.json({error:'email and password required'});
      }
 } catch (error) {
     next(error);
 }
})




//get current user

router.get('/user',jwt.verifyToken,async (req,res,next) => {
  const currentUser = req.user;
  console.log(currentUser)
 try {
      const user = await User.findById({_id:currentUser.userId});
      res.json({user:userInfo(user)});
 } catch (error) {
     next(error);
 }
  
})

//update the user

router.put('/user',jwt.verifyToken, async (req,res,next) => {
  const currentUser = req.user;

  try {
      const user = await User.findByIdAndUpdate(currentUser.userId,req.body.user,{next:true});
      res.json({user:userInfo(user)});
  } catch (error) {
      next(error);
  }


})





//get the profile

router.get('/profiles/:username', async (req,res,next) => {

    const username = req.params.username;

    try {
        const user = await User.findOne({username:username});
        res.json({profile:profileView(user)});
    } catch (error) {
        next(error);
    }

})

//function for profile view

function profileView(user){
    return {
        username:user.username,
        bio:user.bio,
        image:user.image,
        following:false
    }
}


//follow the user

router.post('/profiles/:username/follow',jwt.verifyToken,async (req,res,next) => {
   const username = req.params.username;
   const currentUser = req.user;

   try {
       const user = await User.findOneAndUpdate({email:currentUser.email},{$push : {following : username}});
         res.json({profile:profileView(user)})
   } catch (error) {
       next(error)
   }
})



//unfollow the user

router.delete('/profiles/:username/follow',jwt.verifyToken,async (req,res,next) => {
    const username = req.params.username;
    const currentUser = req.user;
    try {
        const user = await User.findOneAndUpdate({email:currentUser.email},{$pull:{following:username}});
         res.json({profile:profileView(user)});
    } catch (error) {
        next(error);
    }

})







//creating the article

router.post('/articles',jwt.verifyToken,async (req,res,next) => {
    const currentUser = req.user;
    req.body.article.author = req.user;

    try {
        const user = await User.findOne({email:currentUser.email})
        req.body.article.author = currentUser.userId;
        const article = await Article.create(req.body.article)
        
        console.log(article.populate("author"))
        article.author = profileView(user)
        
        res.json({article:articleView(article,profileView(user))})
    } catch (error) {
        next(error);
    }

})



//function to show article

function articleView(article,author){
    return{
        slug:article.slug,
        title:article.title,
        description:article.description,
        body:article.body,
        tagList:article.tagList,
        createdAt:article.createdAt,
        updatedAt:article.updatedAt,
        favorited:false,
        favoritesCount:0,
        author:author
        
    }
}







//feed articles



router.get('/articles/feed', jwt.verifyToken, async (req,res,next) => {
    const currentUser = req.user;
    console.log(currentUser)
 
    try {
        const user = await User.findById({_id:currentUser.userId});
         const following = user.following;
         console.log(following)
         const feed = {};
         
         following.forEach(async (user) => {
             const followingUser = await User.findOne({username:`${user}`})
             console.log(followingUser.id + 'hello')
             const article = await Article.find({author: new mongoose.Types.ObjectId(`${followingUser.id}`)}).sort({_id:-1}).populate('author')
             const articleViews = [];
             
              article.forEach((currentArticle) => {
                  articleViews.push(articleView(currentArticle,profileView(currentArticle.author)))
             })
             feed['articles'] = articleViews;
             console.log(feed.articles)
             res.json({articles:feed.articles,articlesCount:feed.articles.length})
             
         })
      console.log('hello from feed ' + feed)
         
         
    } catch (error) {
        next(error)
    }
 })
 

//updating the article

router.put('/articles/:slug',jwt.verifyToken,async (req,res,next) => {
    const slug = req.params.slug;
    const currentUser = req.user;

    try {
        const user = await User.findOne({email:currentUser.email})
        const article = await Article.findOneAndUpdate({slug:slug},req.body.article,{new:true});
         res.json({article:articleView(article,profileView(user))})
    } catch (error) {
        next(error);
    }
})

//get the article

router.get('/articles/:slug', async (req,res,next) => {
    const slug = req.params.slug;
    
    try {
       
        const article = await Article.findOne({slug:slug}).populate('author')
        res.json({article:articleView(article,profileView(article.author))})
    } catch (error) {
        next(error)
    }
})


//deleting the article

router.delete('/articles/:slug', async (req,res,next) => {
    const slug = req.params.slug;
    const currentUser = req.user;
     try {
         const article = await Article.findOneAndDelete({slug:slug});
         res.json({message:'Article deleted successfully'})
     } catch (error) {
         next(error);
     }
})



// //comment view

function commentView(comment,author){
    return{
      id:comment._id,
      createdAt:comment.createdAt,
      updatedAt:comment.updatedAt,
      body:comment.body,
      author:author
    }
  }
  
  
  //adding comments to articles
  
  router.post('/articles/:slug/comments',jwt.verifyToken, async (req,res,next) => {
    const slug = req.params.slug; 
     const currentUser = req.user;   
     req.body.comment.author = req.user.userId;
     try {
        const comment = await Comment.create(req.body.comment);
       
        const user = await  User.findOne({email:currentUser.email});
        const article = await Article.findOneAndUpdate({slug:slug},{$push : {comments : comment._id}});
        res.json({comment:commentView(comment,profileView(user))})
     } catch (error) {
         next(error)
     }
  })
  
  
  // showing all comments
  
  router.get('/articles/:slug/comments',jwt.verifyToken,async (req,res,next) => {
    const slug = req.params.slug;
  
    try {
        const comments = await Article.findOne({slug:slug}).populate('comments')
        res.json({comments:comments})
    } catch (error) {
        next(error)
    }
   
  
  });
  
  
  
  // deleting comment
  
  router.delete('/articles/:slug/comments/:id',jwt.verifyToken, async (req,res,next) => {
    const slug = req.params.slug;
    const id = req.params.id;
    console.log('hello from delete')
  
    try {
        const article = await Article.findOneAndUpdate({slug:slug},{$pull : {comments : `${id}`}});
        const comment = await Comment.findByIdAndDelete({_id : id})
  
        res.json({message: 'your comment is deleted'});
    } catch (error) {
        next(error)
    }
  
  
  
    
  })


//favorite article

router.post('/articles/:slug/favorite',jwt.verifyToken,(req,res,next) => {

    const slug = req.params.slug;

   console.log(req.user);
    Article.findOneAndUpdate({slug:slug},{$set : {'favorited':true},$inc : {"favoritesCount": 1}},{new:true},(err,article) => {
       if(err) return next();
       User.findByIdAndUpdate({_id : req.user.userId},{$push : {"favoriteArticles" : article.id }},(err,user) => {
            if(err) return next();
            res.json({article:article});

       })


    })



})


// unfavorite article

router.delete('/articles/:slug/favorite',jwt.verifyToken,(req,res,next) => {
  const slug = req.params.slug;

  Article.findOneAndUpdate({slug:slug},{$set:{'favorited' : false},$inc : {'favoritesCount': -1}},{new:true},(err,article) => {
    if(err) return next();

    res.json({article:article})
  })
})


  

//get the list of tags

router.get('/tags', async (req,res,next) => {

    try {
        const tags = await Article.distinct('tagList');
        res.json({tags:tags})
    } catch (error) {
        next(error)
    }
  
  
  })





module.exports = router;