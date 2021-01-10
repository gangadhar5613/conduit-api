var express = require('express');
var router = express.Router();




//welcoming route

router.get('/', async(req,res,next) => {

   try {
     res.json({Message:'Welcome to the Conduit app api',Instruction:'Use /api route for doing any request'})

   } catch (error) {
       
   }

})







module.exports = router;

