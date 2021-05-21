if(process.env.NODE_ENV !=="production"){
  require('dotenv').config();
}


var express = require('express');
const bodyParser = require('body-parser');
var AlumniBasicDetails = require('../models/alumniBasicDetailsModel');
var passport = require('passport');
var bcrypt = require('bcrypt');
var multer = require('multer');
var nodemailer = require('nodemailer');

const Blog = require('../models/blogModel')
const Job = require('../models/jobModel');
//const articleRouter = require('./routes/articles')



const { storage } = require('../cloudinary');
const { cloudinary } = require('../cloudinary');

var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = LocalStorage('./tokens');
/* var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt; */
var authenticate = require('../authenticate');

const app = require('../app');
var router = express.Router();

//for faking a post request as put for updating data
var methodOverride = require('method-override');
router.use(methodOverride('_method'));



var upload = multer({storage}); 




router.use(bodyParser.json());


//
router.get('/',function(req,res,next){

    res.redirect('/alumni/login');

})


/* router.get('/forgotPassword',function(req,res,next){
  var transporter = nodemailer.createTransport({ service: 'Sendgrid', auth: { user: process.env.SENDGRID_USERNAME, pass: process.env.SENDGRID_PASSWORD } });
  var mailOptions = { from: 'no-reply@yourwebapplication.com', to: user.email, subject: 'Account Verification Token', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
  transporter.sendMail(mailOptions, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); }
      res.status(200).send('A verification email has been sent to ' + user.email + '.');
  });
}) */



router.get('/register',function(req,res,next){
    //console.log('indise');
    res.render('alumniRegistration');
})

function presentVerifying(req,res,next){
  req.name = 'alumni';
  //console.log("I am here from created Post");
  next();
}
router.get('/currentAlumniDetails',[presentVerifying,authenticate.verifyUser],async function(req,res){
  const alumni = await AlumniBasicDetails.findById(req.user._id).select(['-alumniPassword','-hashPassword']);
  
  res.render('displayAlumniDetails',{details : alumni});
  //res.send(alumni); 
});



/* GET users listing. */
//authenticate.verifyUser,

router.get('/getdetails/:password',[presentVerifying,authenticate.verifyUser],(req,res,next) => {
  AlumniBasicDetails.find({alumniPassword:req.params.password})
  .then((users) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
  }, (err) => {
      console.log(err);
    next(err);
    })
  .catch((err) => {
        console.log(err);
        next(err);
    });
});

router.post('/register/basic', (req, res, next) => {
    console.log("Registrating");
    //console.log(req.body);
    AlumniBasicDetails.findOne({collegeName:req.body.collegeName, alumniRollNo:req.body.rollNo},async function(err,alumni){
      if(err) {
        console.log("inside");
        console.log(err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({err: err});
      }
      else if(alumni){
        res.statusCode = 400;
        res.setHeader('Content-Type','application/json');
        res.json({success: false,status:'Alumni already exist'});
      }
      else{
        const image = { url:'https://res.cloudinary.com/dzxf40jom/image/upload/v1620374983/Alumni/r1mlxaidfzxhayczkgsn.png' , filename: 'Alumni/r1mlxaidfzxhayczkgsn' };
        newAlumni = new AlumniBasicDetails({collegeName: req.body.collegeName, alumniName: req.body.alumniName, alumniRollNo: req.body.rollNo, alumniEmail:req.body.email, alumniImage : image ,alumniPassword:req.body.password, hashPassword:req.body.password});
        const salt = await bcrypt.genSalt(10);
        newAlumni.hashPassword = await bcrypt.hash(newAlumni.alumniPassword,salt);
        await newAlumni.save((err)=>{
          if(err){
            console.log(err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({err: err});
          }
        });
        
        res.statusCode = 200;
        console.log(req);
        console.log("--------------------");
        console.log(res);
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, status: 'Registration Successful!'});
      }    

    })
});

router.get('/login',function(req,res){
  console.log('Reached LoginPage ');
    res.render('alumniLogin');
});


router.post('/login',async function(req,res){
  var alumni = await AlumniBasicDetails.findOne({alumniName: req.body.alumniName,collegeName: req.body.collegeName});
    if (!alumni) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.json({status:"Alumni "+req.body.alumniName+" not found"});
      //return next(err);
    }
    else{
      const validPassword = await bcrypt.compare(req.body.password,alumni.hashPassword);
      if(!validPassword){
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.json({success:false,status:"Wrong password"});
      }
      else if(validPassword){
        //res.setHeader('Content-Type', 'application/json');
        var token = authenticate.getToken({_id: alumni._id});
        //localStorage.setItem('alumnitoken', token);
        //console.log("TOKEN-------------------",req);
        //res.setHeader('Content-Type', 'application/json');
        // Set-Cookie: <cookie-name>=<cookie-value>
        res.cookie('alumnitoken', token);
        res.cookie('userId' , alumni._id);
        //res.json({success: true,status:'You are authenticated!',token:token});

        res.redirect('/');
       
      }
    }
});
  
router.get('/editDetails/:id',[presentVerifying,authenticate.verifyUser],async function(req,res){
  const alumni = await AlumniBasicDetails.findById(req.params.id).select(['-alumniPassword','-hashPassword']);
  //console.log(req.params.id);

  res.render('editAlumniDetails',{details : alumni});
});


router.put('/updateDetails/:id',[presentVerifying,authenticate.verifyUser],upload.single('profilePic'), async (req, res, next) => {
  //console.log(req);
  //req.files.map(f =>({url : f.path, f.filename}))
  let image;
  const alumni = await AlumniBasicDetails.findById(req.params.id);
  oldImageFileName = alumni.alumniImage.filename;
  console.log(req.file,req.params.id);
  if(typeof req.file!=="undefined"){
    image = { url:req.file.path , filename:req.file.filename}
    await cloudinary.uploader.destroy(oldImageFileName);
  }
  else{
    //const alumni = await AlumniBasicDetails.findById(req.params.id);
    image = { url: alumni.alumniImage.url , filename:alumni.alumniImage.filename }
  }
  
  const { id } = req.params;
  //console.log(req.params);
  const update = await AlumniBasicDetails.findByIdAndUpdate(id, {
      $set: req.body,
      alumniImage : image
  }, { new: true })
  .then((users) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      //res.redirect('/alumni/currentAlumniDetails');
      res.json(users);
  }, (err) => next(err))
  .catch((err) => next(err))

    
  //res.redirect('/alumni/currentAlumniDetails');
});


router.get('/logout', (req, res) => {
  console.log(req.headers);

    res.setHeader('Content-Type','application/json');
    res.cookie('alumnitoken','');
    res.cookie('userId','');
    res.json({success: true,status:"Logged Out Successfully"});

});






/*-----------------------------------------------------Blog code-----------------------------------------------------------*/


router.get('/createBlog/:id', async (req, res) => {
  //const blogs = await Blog.find().sort({ createdAt: 'desc' })
  res.render('../views/mainpage/blog/new', {_id:req.params.id , article: new Blog() })
})

router.post('/createdPost/:id',[presentVerifying,authenticate.verifyUser],upload.single('blogImage'), async (req, res, next) => {

  //console.log("Insider created Post")
  const alumni = await AlumniBasicDetails.findById(req.params.id);
  //console.log("Below alumni")
  const { id } = req.params;
  console.log(req.file);
  const image = { url: req.file.path , filename: req.file.filename };

  let desc = req.body.description;
  _markdown = desc.substr(0,65) + " ...";
  newBlog = new Blog({userId: req.params.id, alumniName: alumni.alumniName, title: req.body.title, blogImage:image, description : _markdown , markdown : req.body.description});

  await newBlog.save((err)=>{
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
  res.json({success: true, status: 'Blog Created!'});

});

router.get('/showblogs',async function(req,res,next){
  const blogs = await Blog.find().sort({ createdAt: 'desc' })
  res.render('../views/mainpage/blog/index', { articles: blogs })
})

router.get('/fullblog/:slug', async (req, res) => {
  console.log("Inside full blog");
  const blog = await Blog.findOne({ slug: req.params.slug })
  //console.log(blog);
  if (blog == null) res.redirect('/alumni/showblogs')
  res.render('../views/mainpage/blog/show', { article: blog })
})


router.get('/editblog/:id',[presentVerifying,authenticate.verifyUser], async (req, res, next) => {
  console.log("Inside edit blog")
  const blog = await Blog.findById(req.params.id)
  if(req.cookies.userId===blog.userId){
    res.render('../views/mainpage/blog/edit', { article: blog })
  }
  else{
    //console.log();
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({display: "You are not the owner of this blog.Hence you cannot edit it!!"});
  }
  //console.log(blog)
  //next();
  
})


router.put('/editblog/:id',[presentVerifying,authenticate.verifyUser],upload.single('blogImage'), async function(req,res,next){
  
  const blog = await Blog.findById(req.params.id);
  if(req.cookies.userId===blog.userId){
    let image;
    oldImageFileName = blog.blogImage.filename;
    //console.log(req.file,req.params.id);
    if(typeof req.file!=="undefined"){
      image = { url:req.file.path , filename:req.file.filename}
      await cloudinary.uploader.destroy(oldImageFileName);
    }
    else{
      //const alumni = await AlumniBasicDetails.findById(req.params.id);
      image = { url: blog.blogImage.url , filename:blog.blogImage.filename }
    }

    const { id } = req.params;
    let desc = req.body.description;
    _markdown = desc.substr(0,65) + " ...";
    const update = await Blog.findByIdAndUpdate(id, {
        description : _markdown , 
        markdown : req.body.description,
        blogImage : image
    }, { new: true })
    .then((blogs) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        //res.redirect('/alumni/currentAlumniDetails');
        res.json(blogs);
    }, (err) => next(err))
    .catch((err) => next(err))
  }
  else{
    //console.log();
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({display: "You are not the owner of this blog.Hence you cannot edit it!!"});
  }
})

router.delete('/deleteblog/:id',[presentVerifying,authenticate.verifyUser], async (req, res, next) => {
  //const id = req.params.id;
  //console.log(id);

  const blog = await Blog.findById(req.params.id);
  console.log(req.cookies.userId,blog.userId,req.cookies.adminId);
  //console.log( (req.cookies.userId!=="undefined" && req.cookies.userId === blog.userId) )
  //console.log( typeof(req.cookies.adminId) === "undefined" );
  if( (req.cookies.userId!=="undefined" && req.cookies.userId === blog.userId) || (typeof(req.cookies.adminId)!=="undefined") ){

  
    imageFilename = blog.blogImage.filename;
    await cloudinary.uploader.destroy(imageFilename);
    await Blog.findOneAndRemove({_id: req.params.id },
      function (err, docs) {
        if (err){
          console.log(err)
        }
        else{
          console.log("Removed Blog");
        }
    });


    res.redirect('/alumni/showblogs');
  }
  else{
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.json({display: "You are not the owner of this blog.Hence you cannot delete it!!"});   
  }
});








/*----------------------------------------------- Career Opportunities Code ------------------------------------*/




router.get('/editjob/:job_id',[presentVerifying,authenticate.verifyUser], async (req, res, next) => {
  const job = await Job.findById(req.params.job_id)
  
  if( req.cookies.userId === job.uploadedByUserId ){
    
    console.log("------------------",req.params.job_id);
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

module.exports = router;
