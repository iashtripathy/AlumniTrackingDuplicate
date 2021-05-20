var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
var AlumniBasicDetails = require('../models/alumniBasicDetailsModel');
var authenticate = require('../authenticate');

//const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
//const mapBoxToken = process.env.MAPBOX_TOKEN;
//const geocoder = mbxGeocoding({ accessToken: mapBoxToken});




function isLoggedIn(token){
  //console.log("I am inside Is logged In finctuon",req);
  //var token = req.cookies.alumnitoken;
  console.log(typeof(token));
  if( typeof(token) === "undefined" || token.length == 0  ) {
    return false;
  }
  else{
    return true;
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  //console.log('I am in main page',req);
  if(isLoggedIn(req.cookies.alumnitoken)){
    //console.log("I am here")
    res.render('../views/mainpage/index.ejs',{logInStatus : true});
  }
  else{
    //console.log("I am here")
    res.render('../views/mainpage/index.ejs',{logInStatus : false});
  }
  
});



router.get('/index',function(req,res){
  res.redirect('/');
});

router.get('/images',function(req,res){
  if(isLoggedIn(req.cookies.alumnitoken)){
    res.render('../views/mainpage/images.ejs',{logInStatus : true});
  }
  else{
    res.render('../views/mainpage/images.ejs',{logInStatus : false});
  }
});

router.get('/stories',function(req,res){
  if(isLoggedIn(req.cookies.alumnitoken)){
    //console.log(req);
    //const users = await AlumniBasicDetails.find({}).select(['-alumniPassword','-hashPassword']);
    res.render('../views/mainpage/blog/stories.ejs',{_id : req.cookies.userId , logInStatus : true});
  }
  else{
    res.render('../views/mainpage/blog/stories.ejs',{logInStatus : false});
  }
});

router.get('/contact',function(req,res){
  if(isLoggedIn(req.cookies.alumnitoken)){
    res.render('../views/mainpage/contact.ejs',{logInStatus : true});
  }
  else{  
    res.render('../views/mainpage/contact.ejs',{logInStatus : false});
  }
});

router.get('/team',function(req,res){
  if(isLoggedIn(req.cookies.alumnitoken)){
    res.render('../views/mainpage/team.ejs',{logInStatus : true});  
  }
  else{  
    res.render('../views/mainpage/team.ejs',{logInStatus : false});
  }
});

router.get('/services',async function(req,res){
  const users = await AlumniBasicDetails.find({}).select(['-alumniPassword','-hashPassword']);
  if(isLoggedIn(req.cookies.alumnitoken)){
    res.render('../views/mainpage/services.ejs',{records : users , logInStatus : true});
  }
  else{  
    res.render('../views/mainpage/services.ejs',{records : users,logInStatus : false});
  }
});

router.get('/events',function(req,res){
  if(isLoggedIn(req.cookies.alumnitoken)){
    res.render('../views/mainpage/events.ejs',{logInStatus : true});
  } 
  else{
    res.render('../views/mainpage/events.ejs',{logInStatus : false});
  }
});

router.get('/storySingle',function(req,res){
  
  if(isLoggedIn(req.cookies.alumnitoken)){
    res.render('../views/mainpage/blog/storySingle.ejs',{logInStatus : true});
  }  
  else{
    res.render('../views/mainpage/blog/storySingle.ejs',{logInStatus : false});
  }
});











module.exports = router;
