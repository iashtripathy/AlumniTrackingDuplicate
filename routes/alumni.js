if(process.env.NODE_ENV !=="production"){
  require('dotenv').config();
}


var express = require('express');
const bodyParser = require('body-parser');
var AlumniBasicDetails = require('../models/alumniBasicDetailsModel');
var Token = require('../models/tokenModel');
var passport = require('passport');
var bcrypt = require('bcrypt');
var multer = require('multer');
var nodemailer = require('nodemailer');

const Blog = require('../models/blogModel')
const Job = require('../models/jobModel');
const Event = require('../models/eventsModel');
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



let transport = nodemailer.createTransport({
  //  host: 'smtp.mailtrap.io',
    service : 'gmail',
  //  port: 2525,
    auth: {
       user: process.env.EMAIL,
       pass: process.env.EMAIL_KEY
    }
});






//
router.get('/',function(req,res,next){

    res.redirect('/alumni/login');

})



/*--------------------------------------------------------------Forgot Password Beginning----------------------------------------------------------*/

//When the user clicks on forgot password this is the page rendered.
router.get('/forgotPassword',function(req,res,next){
  res.render('alumniLogin',{type : 'forgotPassword'})
})


//This post request is made when the user enters his registered email id to change the password.Now here the password changing link is sent to user
router.post('/forgotPassword',async function(req,res,next){

  AlumniBasicDetails.findOne({alumniEmail:req.body.email},async function(err,alumni){

    if(err) {
      console.log("inside");
      console.log(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else if(alumni){
      var token = authenticate.getToken({_id: alumni._id});
      var saveToken = new Token({_userId:alumni._id , token:token });

      saveToken.save(function(err){
        if(err){
          res.status = 500;
          res.send({message: err.message })
        }

        console.log("HEADERS HOST");
        console.log(req.headers.host);
        const message = {
          from: "testalumniapp@gmail.com", // Sender address
          to: req.body.email,         // recipients
          subject: 'Password Resetting Link', // Subject line
          text: 'Please click on the link to change password: \nhttp:\/\/' + req.headers.host + '\/alumni' + '\/changePassword\/' + saveToken.token + '\/' + req.body.email + '.\n'
        }
        transport.sendMail(message, function(err, info) {
            if (err) {
              console.log(err)
              res.send(err);
            } else {
              res.status = 200;
              res.send('Change Password link has been sent to ' + req.body.email + '.');
            }
        });



      })    

    }
    else{
      res.statusCode = 200;
      //console.log(req);
      console.log("--------------------");
      //console.log(res);
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: 'Alumni with the entered email isnt found.Please go back and try again'});      
    }
  })
 /*  else{
    res.status = 500;
    res.send({result:"No alumni with the entered email found.Please recheck the email and try again!"});
  } */
})



//This renders the page where user enters the new password.This stages is reached immediately after the link is verifies through email by the alumni
router.get('/changePassword/:token/:regEmail',function(req,res,next){
  const alumni = AlumniBasicDetails.findOne({alumniEmail : req.params.regEmail},function(err,alumni){
    if(err){
      console.log(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});      
    }
    else if(alumni){
      Token.findOne({ token: req.params.token }, function (err, token) {
        if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token for the Email Id. Your token my have expired.' });
    
        res.render('alumniLogin',{type : 'changePassword',email: req.params.regEmail })
      }); 
    }
    else{
      res.status = 200
      res.send({success: false, status: 'Alumni with the entered email isnt found.Please go back and try again'})
    }
  })


})


//Final put request to update the password after the user enters the new password and hits submit

router.put('/updatePassword',async function(req,res,next){
  console.log(req.body.email);
  
  // Verify and save the user
  //alumni.alumniPassword = req.body.password;
  await AlumniBasicDetails.findOne({alumniEmail : req.body.email},async function(err,alumni){
    if(err) {
      //console.log("inside");
      console.log(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else if(alumni){
      const salt = await bcrypt.genSalt(10);
      hashPassword = await bcrypt.hash(req.body.password,salt);
      const update = await AlumniBasicDetails.findByIdAndUpdate(alumni._id, {
        $set : {alumniPassword : req.body.password , hashPassword : hashPassword}
      }, { new: true })
        .then((alumni) => {
    
    
          Token.findOneAndRemove({_userId : alumni._id },
            function (err, docs) {
              if (err){
                console.log("Token Error")
                res.send(err);
              }
              else{
                console.log("Token Removed");
              }
          });
      
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          //res.redirect('/alumni/currentAlumniDetails');
          res.redirect('/alumni/login');
      }, (err) => next(err))
        .catch((err) => console.log("Here is errror",err)
      )
    
    }
    else{

    }
  });


 

})


/*--------------------------------------------------------------Forgot Password Ending----------------------------------------------------------*/




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
  let userType = new Map()
  userType['alumni'] = false;
  userType['admin'] = false;


  if(typeof(req.cookies.userId !== "undefined")){
    if(typeof(req.cookies.alumnitoken !== "undefined")) {
      userType['alumni'] = true
    }
    else if(typeof(req.cookies.admintoken !== "undefined")){
      userType['admin'] = true
    }
  }
  res.render('displayAlumniDetails',{ user_type: userType , details : alumni});
  //res.send(alumni); 
});


router.post('/register/basic', (req, res, next) => {
    console.log("Registrating");

    
    AlumniBasicDetails.findOne({alumniEmail:req.body.email},async function(err,alumni){
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
        let website,linkedin,facebook,instagram     
        const image = { url:'https://res.cloudinary.com/dzxf40jom/image/upload/v1621967741/Alumni/gdqldyoge92sbmdw2ein.png' , filename: 'Alumni/gdqldyoge92sbmdw2ein' };
        newAlumni = new AlumniBasicDetails({ 
          alumniName: req.body.alumniName, 
          alumniRollNo: req.body.rollNo, 
          alumniEmail:req.body.email, 
          alumniImage : image ,
          alumniDegree : req.body.degree,
          alumniBranch : req.body.branch,
          alumniGraduationYear : req.body.graduationYear,
          alumniAddress : req.body.address,
          alumniSkills : req.body.skills,
          alumniCurrentWorkingCompany : req.body.company,
          alumniDesignation : req.body.designation,
          alumniWorkExperience : req.body.experience,
          alumniCurrentLocationCity : req.body.city,
          alumniCurrentLocationZip : req.body.zip,
          alumniCurrentLocationState : req.body.state,
          alumniCurrentLocationCountry : req.body.country,
          alumniHigherEducation : req.body.higherEducation,
          alumniWebsite : req.body.website,
          alumniLinkedin : req.body.linkedin,
          alumniGithub : req.body.github,
          alumniInstagram : req.body.instagram,
          alumniFacebook : req.body.facebook,
          alumniTwitter : req.body.twitter,
        
          hashPassword:req.body.password
        });
        const salt = await bcrypt.genSalt(10);
        newAlumni.hashPassword = await bcrypt.hash(req.body.password,salt);
        await newAlumni.save((err)=>{
          if(err){
            console.log(err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.send({err: err});
          }
          else{
            var token = authenticate.getToken({_id: newAlumni._id});
            var saveToken = new Token({_userId:newAlumni._id , token:token });
            
            saveToken.save(function(err){
              if(err){
                res.status = 500;
                res.send({message: err.message })
              }
  
                
                
                //send mail
              console.log("HEADERS HOST");
              console.log(req.headers.host);
              const message = {
                from: "testalumniapp@gmail.com", // Sender address
                to: req.body.email,         // recipients
                subject: 'Account Verification Token', // Subject line
                text: 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/alumni' + '\/confirmToken\/' + saveToken.token + '.\n'
              }
              transport.sendMail(message, function(err, info) {
                  if (err) {
                    console.log(err)
                    res.send(err);
                  } else {
                    res.status = 200;
                    res.send('A verification email has been sent to ' + req.body.email + '.');
                  }
              });
                
                
  
  
  
  
            })

            res.statusCode = 200;
            //console.log(req);
            console.log("--------------------");
            //console.log(res);
            res.setHeader('Content-Type', 'application/json');
            res.json({success: true, status: 'Check Your email and verify token immediately'});

          }


        });
        

      }    

    })
});


router.get('/confirmToken/:token',function(req,res){

  Token.findOne({ token: req.params.token }, function (err, token) {
    if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });

    // If we found a token, find a matching user
    AlumniBasicDetails.findOne({ _id: token._userId}, function (err, alumni) {
        if (!alumni) return res.status(400).send({ msg: 'We were unable to find an alumni for this token.' });
        if (alumni.isVerified) return res.status(400).send({ type: 'already-verified', msg: 'This alumni has already been verified.' });

        // Verify and save the user
        alumni.isVerified = true;
        alumni.save(function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); }
            Token.findOneAndRemove({_id: token._id , _userId : alumni._id },
              function (err, docs) {
                if (err){
                  res.send(err);
                }
                else{
                  console.log("Token Removed");
                }
            });
            res.status(200).send('Your account has been verified.You can login now');
        });
    });
  }); 

})



router.get('/login',function(req,res){
  console.log('Reached LoginPage ');
    res.render('alumniLogin',{type : 'login'});
});


router.post('/login',async function(req,res){
  var alumni = await AlumniBasicDetails.findOne({alumniEmail: req.body.email});
    if (!alumni) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.json({status:"Alumni withe email : "+ req.body.email + "not found"});
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

        if(!alumni.isVerified){
          if(Token.findOne({_userId : alumni._id})){
            return res.status(401).send({ type: 'not-verified', msg: 'Your account has not been verified.Please Verify your account' });  
          }
          else{
              
              //Send token again as it is expired
              const message = {
                from: "testalumniapp@gmail.com", // Sender address
                to: alumni.alumniEmail,         // recipients
                subject: 'Account Verification Token', // Subject line
                text: 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/alumni' + '\/confirmToken\/' + saveToken.token + '.\n'
              };
              transport.sendMail(message, function(err, info) {
                  if (err) {
                    console.log(err)
                    res.send(err);
                  } else {
                    res.status = 200;
                    res.send('A verification email has been sent again to ' + alumni.alumniEmail + '.');
                  }
              });
          }
          
        } 
        else{
          var token = authenticate.getToken({_id: alumni._id});

          // Set-Cookie: <cookie-name>=<cookie-value>
          res.cookie('alumnitoken', token);
          res.cookie('userId' , alumni._id);
  
  
          res.redirect('/');
        }



 
       
      }
    }
});
  
router.get('/editDetails/:id',[presentVerifying,authenticate.verifyUser],async function(req,res){
  const alumni = await AlumniBasicDetails.findById(req.params.id).select(['-alumniPassword','-hashPassword']);
  //console.log(req.params.id);
  let userType = new Map()
  userType['alumni'] = false;
  userType['admin'] = false;


  if(typeof(req.cookies.userId !== "undefined")){
    if(typeof(req.cookies.alumnitoken !== "undefined")) {
      userType['alumni'] = true
    }
    else if(typeof(req.cookies.admintoken !== "undefined")){
      userType['admin'] = true
    }
  }
  res.render('editAlumniDetails',{user_type: userType , details : alumni});
});


router.put('/updateDetails/:id',[presentVerifying,authenticate.verifyUser],upload.single('profilePic'), async (req, res, next) => {
  //console.log(req);
  //req.files.map(f =>({url : f.path, f.filename}))
  let image;
  const alumni = await AlumniBasicDetails.findById(req.params.id);
  oldImageFileName = alumni.alumniImage.filename;
  console.log(req.file,req.params.id);
  
  if(typeof req.file!=="undefined"){
    if(alumni.alumniImage.url!=="https://res.cloudinary.com/dzxf40jom/image/upload/v1621967741/Alumni/gdqldyoge92sbmdw2ein.png"){
      await cloudinary.uploader.destroy(oldImageFileName);
    }
    image = { url:req.file.path , filename:req.file.filename}
    
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
      res.redirect('/alumni/currentAlumniDetails');
  }, (err) => next(err))
  .catch((err) => next(err))

    
  //res.redirect('/alumni/currentAlumniDetails');
});


router.get('/logout', (req, res) => {
  //console.log(req.headers);

    //res.setHeader('Content-Type','application/json');
    res.cookie('alumnitoken','');
    res.cookie('userId','');
    //res.json({success: true,status:"Logged Out Successfully"});
    res.redirect('/');

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
 

  let image;
  
  //if no image is given as input put the default image
  if(typeof req.file==="undefined"){
    image = { url:'https://res.cloudinary.com/dzxf40jom/image/upload/v1622037742/Alumni/nnejmzaqcerkeqt2tg5a.jpg' , filename: 'Alumni/nnejmzaqcerkeqt2tg5a' };
  }
  else{
    //const alumni = await AlumniBasicDetails.findById(req.params.id);
    image = { url: req.file.path , filename : req.file.filename }
  }


  let desc = req.body.description;
  _markdown = desc.substr(0,65) + " ...";
  newBlog = new Blog({
    userId: req.params.id, 
    alumniName: alumni.alumniName, 
    title: req.body.title, 
    blogImage:image, 
    description : _markdown , 
    markdown : req.body.description
  });

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
  //res.json({success: true, status: 'Blog Created!'});
  res.redirect('/stories');
});

router.get('/showblogs',async function(req,res,next){
  //const blogs = await Blog.find().sort({ createdAt: 'desc' })
  res.send(blogs);
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



    if(typeof req.file!=="undefined"){
      if(blog.blogImage.url!=="https://res.cloudinary.com/dzxf40jom/image/upload/v1622037742/Alumni/nnejmzaqcerkeqt2tg5a.jpg"){
        await cloudinary.uploader.destroy(oldImageFileName);
      }
      image = { url:req.file.path , filename:req.file.filename}
      
    }
    else{
 
      image = { url: blog.blogImage.url , filename:blog.blogImage.filename }
    }


    const { id } = req.params;
    let desc = req.body.description;
    _markdown = desc.substr(0,65) + " ...";
    const update = await Blog.findByIdAndUpdate(id, {
        title : req.body.title,
        description : _markdown , 
        markdown : req.body.description,
        blogImage : image
    }, { new: true })
    .then((blogs) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.redirect('/stories');
        //res.json(blogs);
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




/*-----------------------------------------Alumni attending the event--------------------------------------------------------------*/

router.put('/attendEvent/:event_id',[presentVerifying,authenticate.verifyUser],async function(req,res,next){

  const alumni = await AlumniBasicDetails.findById(req.cookies.userId);
  //console.log(alumni);
  const event = await Event.findById(req.params.event_id);
  //res.send(alumni.alumniEmail);
  var set = 0;
  for(var i=0;i<event.attendies.length;i++){
    if(event.attendies[i]===alumni.alumniEmail){
      //alert("Already attending the event");
      set = 1;
      res.json("Already attending the event")
      break;
    }
  }

  if(set==0){
    event.attendies = event.attendies.concat(alumni.alumniEmail);
    await event.save().then((event) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      //res.redirect('/alumni/currentAlumniDetails');
      //res.json(event);
      res.redirect('/events');
    }, (err) => next(err))
    .catch((err) => next(err))
  }
  

});
module.exports = router;
