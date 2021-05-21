if(process.env.NODE_ENV !=="production"){
  require('dotenv').config();
}

var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
var AlumniBasicDetails = require('../models/alumniBasicDetailsModel');
var Admin = require('../models/adminModel');
var authenticate = require('../authenticate');
const Blog = require('../models/blogModel');
const Job = require('../models/jobModel');



var multer = require('multer');
const { storage } = require('../cloudinary');
const { cloudinary } = require('../cloudinary');
var upload = multer({storage}); 



//for faking a post request as put for updating data
var methodOverride = require('method-override');
router.use(methodOverride('_method'));



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

router.get('/', async function(req, res, next) {
  //console.log('I am in main page',req);
  const blogs = await Blog.find().sort({ createdAt: 'desc' })
  const jobs = await Job.find().sort({ createdAt: 'desc' })
  if(isLoggedIn(req.cookies.alumnitoken) || isLoggedIn(req.cookies.admintoken)){
    //console.log("I am here")
    res.render('../views/mainpage/index.ejs',{jobs: jobs , articles : blogs , logInStatus : true});
  }
  else{
    //console.log("I am here")
    res.render('../views/mainpage/index.ejs',{jobs: jobs , articles : blogs , logInStatus : false});
  }
  
});



router.get('/index',function(req,res){
  res.redirect('/');
});

router.get('/images',function(req,res){
  if(isLoggedIn(req.cookies.alumnitoken) || isLoggedIn(req.cookies.admintoken)){
    res.render('../views/mainpage/images.ejs',{logInStatus : true});
  }
  else{
    res.render('../views/mainpage/images.ejs',{logInStatus : false});
  }
});



router.get('/contact',function(req,res){
  if(isLoggedIn(req.cookies.alumnitoken) || isLoggedIn(req.cookies.admintoken)){
    res.render('../views/mainpage/contact.ejs',{logInStatus : true});
  }
  else{  
    res.render('../views/mainpage/contact.ejs',{logInStatus : false});
  }
});

router.get('/team',function(req,res){
  if(isLoggedIn(req.cookies.alumnitoken) || isLoggedIn(req.cookies.admintoken)){
    res.render('../views/mainpage/team.ejs',{logInStatus : true});  
  }
  else{  
    res.render('../views/mainpage/team.ejs',{logInStatus : false});
  }
});



router.get('/events',function(req,res){
  if(isLoggedIn(req.cookies.alumnitoken) || isLoggedIn(req.cookies.admintoken)){
    res.render('../views/mainpage/events.ejs',{logInStatus : true});
  } 
  else{
    res.render('../views/mainpage/events.ejs',{logInStatus : false});
  }
});


router.get('/stories',async function(req,res){
  const blogs = await Blog.find().sort({ createdAt: 'desc' })
  if(isLoggedIn(req.cookies.alumnitoken) || isLoggedIn(req.cookies.admintoken)){
    //console.log(req);
    //const users = await AlumniBasicDetails.find({}).select(['-alumniPassword','-hashPassword']);
    res.render('../views/mainpage/blog/stories.ejs',{articles : blogs ,_id : req.cookies.userId , logInStatus : true});
  }
  else{
    res.render('../views/mainpage/blog/stories.ejs',{articles : blogs ,logInStatus : false});
  }
});

router.get('/storySingle/:id',async function(req,res){
  const blog = await Blog.findById(req.params.id)
  const alumni = await AlumniBasicDetails.findById(blog.userId).select(['-alumniPassword','-hashPassword']);
  
  let userType = new Map()
  userType['alumni'] = false;
  userType['admin'] = false;
  userType['viewer'] = false;

  if(isLoggedIn(req.cookies.alumnitoken)){
    userType['alumni'] = true
  }
  else if(isLoggedIn(req.cookies.admintoken)){
    userType['admin'] = true
  }
  else{
    userType['viewer'] = true
  }
  if(userType['alumni'] || userType['admin']){
    res.render('../views/mainpage/blog/storySingle.ejs',{user: alumni , article : blog , _id : req.cookies.userId , user_type : userType , logInStatus : true});
  }  
  else{
    res.render('../views/mainpage/blog/storySingle.ejs',{user : alumni , article : blog , user_type : userType , logInStatus : false});
  }
});




router.get('/services',async function(req,res){
  const users = await AlumniBasicDetails.find({}).select(['-alumniPassword','-hashPassword']);
  const jobs = await Job.find().sort({ createdAt: 'desc' })
  
  let userType = new Map()
  userType['alumni'] = false;
  userType['admin'] = false;
  userType['viewer'] = false;

  if(isLoggedIn(req.cookies.alumnitoken)){
    userType['alumni'] = true
  }
  else if(isLoggedIn(req.cookies.admintoken)){
    userType['admin'] = true
  }
  else{
    userType['viewer'] = true
  }
  if(userType['alumni'] || userType['admin']){
    res.render('../views/mainpage/services.ejs',{jobs: jobs , records : users , user_id : req.cookies.userId ,user_type : userType , logInStatus : true});
  }
  else{  
    res.render('../views/mainpage/services.ejs',{jobs: jobs , records : users  , user_type : userType , logInStatus : false});
  }
});


router.get('/postjob/:user_id',async function(req,res,next){
  res.render('../views/mainpage/job/new.ejs',{ user_id : req.params.user_id , job : new Job()});
});



function presentVerifying(req,res,next){
  if(req.cookies.alumnitoken){
    req.name = 'alumni';
  }
  else if(req.cookies.admintoken){
    req.name = 'admin';
  }
  //console.log("I am here from created Post");
  next();
}

//
router.post('/postedJob/:user_id',[presentVerifying,authenticate.verifyUser],upload.single('companyImage') , async (req, res, next) => {

  //console.log("Insider created Post")
  //const alumni = await AlumniBasicDetails.findById(req.params.user_id);
  //console.log("Below alumni")
  //const { id } = req.params;
  //console.log(req.file);
  
  const image = { url: req.file.path , filename: req.file.filename };

  var arr = req.body.tags;

  arr = arr.replace(/\s/g,'');

  skills = arr.split(",");

  
  newJob = new Job({
    title: req.body.title, 
    link: req.body.link, 
    experience: req.body.experience, 
    location:req.body.location, 
    tags : skills , 
    uploadedByUserId : req.params.user_id,
    companylogo : image
  });

  await newJob.save((err)=>{
    if(err){
      console.log(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
  });
  
  res.statusCode = 200;
  //console.log(req);
  console.log("--------------------");
  //console.log(res);
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, status: 'Job Created!'});

});







module.exports = router;
