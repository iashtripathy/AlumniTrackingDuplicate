if(process.env.NODE_ENV !=="production"){
  require('dotenv').config();
}

var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
var AlumniBasicDetails = require('../models/alumniBasicDetailsModel');
var Admin = require('../models/adminModel');
var Event = require('../models/eventsModel');
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
  const events = await Event.find().sort({ createdAt: 'desc' })
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
  console.log("Inside")
  res.render('../views/mainpage/index.ejs',{jobs: jobs , articles : blogs , events: events ,user_type : userType});

  
});

router.get('/index',function(req,res){
  res.redirect('/');
});



router.get('/images',function(req,res){

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
 
  
  res.render('../views/mainpage/images.ejs',{user_type : userType});
    
});



router.get('/contact',function(req,res){
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
 
  
  res.render('../views/mainpage/contact.ejs',{user_type : userType});
});



router.get('/team',function(req,res){
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
 
  
  res.render('../views/mainpage/team.ejs',{user_type : userType});
});



router.get('/events',async function(req,res){
  const events = await Event.find().sort({ createdAt: 'desc' })
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
  res.render('../views/mainpage/events.ejs',{user_id : req.cookies.userId , events : events , user_type : userType});
});





router.get('/stories',async function(req,res){
  const blogs = await Blog.find().sort({ createdAt: 'desc' })
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
    res.render('../views/mainpage/blog/stories.ejs',{articles : blogs ,_id : req.cookies.userId , user_type : userType});
  }
  else{
    res.render('../views/mainpage/blog/stories.ejs',{articles : blogs ,user_type : userType});
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
    res.render('../views/mainpage/blog/storySingle.ejs',{user: alumni , article : blog , _id : req.cookies.userId , user_type : userType});
  }  
  else{
    res.render('../views/mainpage/blog/storySingle.ejs',{user : alumni , article : blog , user_type : userType});
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
    res.render('../views/mainpage/services.ejs',{jobs: jobs , records : users , user_id : req.cookies.userId ,user_type : userType});
  }
  else{  
    res.render('../views/mainpage/services.ejs',{jobs: jobs , records : users  , user_type : userType});
  }
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


/*------------------------------------------------------Deleting Blog--------------------------------------------------*/

router.delete('/deleteblog/:id',[presentVerifying,authenticate.verifyUser], async (req, res, next) => {
  //const id = req.params.id;
  //console.log(id);

  const blog = await Blog.findById(req.params.id);
  //console.log(req.cookies.userId,blog.userId,req.cookies.adminId);
  //console.log( (req.cookies.userId!=="undefined" && req.cookies.userId === blog.userId) )
  //console.log( typeof(req.cookies.adminId) === "undefined" );
  if( (req.cookies.userId!=="undefined" && req.cookies.userId === blog.userId) || (typeof(req.cookies.admintoken)!=="undefined") ){

  
    imageFilename = blog.blogImage.filename;
    if(blog.blogImage.url!=="https://res.cloudinary.com/dzxf40jom/image/upload/v1621970001/Alumni/qnvcvxtfyfenks51l2nj.jpg"){
      await cloudinary.uploader.destroy(imageFilename);
    }

    await Blog.findOneAndRemove({_id: req.params.id },
      function (err, docs) {
        if (err){
          console.log(err)
        }
        else{
          console.log("Removed Blog");
        }
    });


    res.redirect('/stories');
  }
  else{
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({display: "You are not the owner of this blog.Hence you cannot delete it!!"});   
  }
});



/*------------------------------------------------CRUD Career Opportunities-------------------------------------------------------------------- */



router.get('/postjob/:user_id',async function(req,res,next){
  res.render('../views/mainpage/job/new.ejs',{ user_id : req.params.user_id , job : new Job()});
});




//
router.post('/postedJob/:user_id',[presentVerifying,authenticate.verifyUser],upload.single('companyImage') ,(req, res, next) => {

  Job.findOne({link : req.body.link},async function(err,job){
    if(err) {
      console.log("inside");
      console.log(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }   
    else if(job){
      res.statusCode = 400;
      res.setHeader('Content-Type','application/json');
      res.json({success: false,status:'This job already exist'});
    }
    else{
      const image = { url: req.file.path , filename: req.file.filename };


      var postedBy;
      const alumni = await AlumniBasicDetails.findById(req.params.user_id);
      
      if(alumni===null){
        postedBy = 'admin'
      }
      else{
        postedBy = alumni.alumniName
      }
      newJob = new Job({
        title: req.body.title, 
        link: req.body.link, 
        experience: req.body.experience, 
        location:req.body.location, 
        uploadedByName: postedBy,
        companyName: req.body.companyname,
    
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
      res.redirect('/services')
    }
  })

});




router.get('/editjob/:job_id',[presentVerifying,authenticate.verifyUser], async (req, res, next) => {
  const job = await Job.findById(req.params.job_id)
  
  if( req.cookies.userId === job.uploadedByUserId ){
    
    //console.log("------------------",req.params.job_id);
    //res.render('../views/mainpage/job/edit')
    res.render('../views/mainpage/job/edit',{ job : job});
  }
  else{
    //console.log();
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({display: "You are not the owner of this post.Hence you cannot edit it!!"});
  }
  
})



 router.put('/editedjob/:job_id',[presentVerifying,authenticate.verifyUser],upload.single('companyImage'), async function(req,res,next){
  //console.log("Inside Edited job post",job_id)
  //console.log(typeof(job_id));
  const job = await Job.findById(req.params.job_id);
  const alumni = await AlumniBasicDetails.findById(job.uploadedByUserId);
  if(req.cookies.userId===job.uploadedByUserId){
    let image;
    oldImageFileName = job.companylogo.filename;
    //console.log(req.file,req.params.job_id);
    if(typeof req.file!=="undefined"){
      image = { url:req.file.path , filename:req.file.filename}
      await cloudinary.uploader.destroy(oldImageFileName);
    }
    else{
      //const alumni = await AlumniBasicDetails.findById(req.params.id);
      image = { url: job.companylogo.url , filename:job.companylogo.filename }
      //console.log(image)
    }

    const id  = req.params.job_id;
    var postedBy;
    if(alumni===null){
      postedBy = 'admin'
    }
    else{
      postedBy = alumni.alumniName
    }

    const update = await Job.findByIdAndUpdate(id, {
      title: req.body.title, 
      link: req.body.link, 
      experience: req.body.experience, 
      location:req.body.location, 
      uploadedByName: postedBy,
      companyName: req.body.companyname,
      uploadedByUserId : job.uploadedByUserId,
      companylogo : image
    }, { new: true })
    .then((jobPost) => {
        res.statusCode = 200;
        //res.setHeader('Content-Type', 'application/json');
        //res.redirect('/alumni/currentAlumniDetails');
        //res.json(jobPost);
        res.redirect('/services');
    }, (err) => next(err))
    .catch((err) => next(err))
  }
  else{
    //console.log();
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({display: "You are not the owner of this post.Hence you cannot edit it!!"});
  }
})








router.delete('/deletejob/:job_id',[presentVerifying,authenticate.verifyUser], async (req, res, next) => {
  //const id = req.params.id;
  //console.log(id);

  const job = await Job.findById(req.params.job_id);
  //console.log(req.cookies.userId,blog.userId,req.cookies.adminId);
  //console.log( (req.cookies.userId!=="undefined" && req.cookies.userId === blog.userId) )
  //console.log( typeof(req.cookies.adminId) === "undefined" );
  //console.log(req.cookies.adminId)
  if( (req.cookies.userId!=="undefined" && req.cookies.userId === job.uploadedByUserId) || (typeof(req.cookies.admintoken)!=="undefined") ){

  
    imageFilename = job.companylogo.filename;
    await cloudinary.uploader.destroy(imageFilename);
    await Job.findOneAndRemove({_id: req.params.job_id },
      function (err, docs) {
        if (err){
          console.log(err)
        }
        else{
          console.log("Removed Posted Job");
        }
    });


    res.redirect('/services');
  }
  else{
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({display: "You are not authenticated to delete it!!"});   
  }
});




module.exports = router;
