if(process.env.NODE_ENV !=="production"){
  require('dotenv').config();
}


var express = require('express');
const bodyParser = require('body-parser');
var AdminDetails = require('../models/adminModel');
var AlumniBasicDetails = require('../models/alumniBasicDetailsModel');
var Event = require('../models/eventsModel');
var passport = require('passport');
var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = LocalStorage('./tokens');
/* var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt; */
var authenticate = require('../authenticate');

const { cloudinary } = require('../cloudinary');

var router = express.Router();
router.use(bodyParser.json());


var methodOverride = require('method-override');
router.use(methodOverride('_method'));

//
router.get('/',function(req,res,next){
    res.render('adminLogin');
})

/* router.get('/details',function(req,res,next){
  res.send('Admin Details Page');
}) */


function isLoggedIn(token){
  console.log(typeof(token));
  if( typeof(token) === "undefined" || token.length == 0  ) {
    return false;
  }
  else{
    return true;
  }
}




function presentVerifying(req,res,next){
  req.name = 'admin';
  next();
}





router.get('/details',[presentVerifying,authenticate.verifyUser],async function(req,res){
  let userType = new Map()
  userType['alumni'] = false;
  userType['admin'] = false;
  userType['viewer'] = false;
  let user;
  const alumnis = await AlumniBasicDetails.find({}).select(['-alumniPassword','-hashPassword']);
  if(isLoggedIn(req.cookies.alumnitoken)){
    userType['alumni'] = true
    user = await AlumniBasicDetails.findById(req.cookies.userId);
  }
  else if(isLoggedIn(req.cookies.admintoken)){
    userType['admin'] = true
  }
  else{
    userType['viewer'] = true
  }

  res.render('../views/mainpage/admindetails.ejs',{user_type : userType , user: user ,records: alumnis});
});



router.post('/register', (req, res, next) => {
  console.log("Registrating");
  console.log(req.body);
  AdminDetails.findOne({username:req.body.username, password:req.body.password},async function(err,admin){
    if(err) {
      console.log("inside");
      console.log(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else if(admin){
      res.statusCode = 400;
      res.setHeader('Content-Type','application/json');
      res.json({success: false,status:'Admin already exist'});
    }
    else{
      admin = new AdminDetails({username:req.body.username, password:req.body.password, hashPassword:req.body.password});
      const salt = await bcrypt.genSalt(10);
      admin.hashPassword = await bcrypt.hash(admin.password,salt);
      await admin.save((err)=>{
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






router.get('/updateCredentials',function(req,res){
    res.render('adminUpdate');
});
//for updating
router.post('/updateCredentials',[presentVerifying,authenticate.verifyUser], (req, res, next) => {
    AdminDetails.findById({_id:'5e2db3d930a0e9312f356c7c'},async function(err,admin){
      if(err) {
        console.log("inside");
        console.log(err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({err: err});
      }
      else{
        admin.username = req.body.username; 
        admin.password = req.body.password;
        admin.hashPassword = req.body.password;
        const salt = await bcrypt.genSalt(10);
        admin.hashPassword = await bcrypt.hash(admin.password,salt);
        await admin.save((err)=>{
          if(err){
            console.log(err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({err: err});
          }
        });
        console.log(admin);
        res.statusCode = 200;
        
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, status: 'Updation Successful!'});
      }    

    })
});

router.get('/login',function(req,res){
    res.render('adminLogin');
});


router.post('/login',async function(req,res){
  console.log(req.body.username);
  var admin = await AdminDetails.findOne({username: req.body.username});
    if (!admin) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.json({status:"Admin "+" not found"});
      //return next(err);
    }
    else{
      const validPassword = await bcrypt.compare(req.body.password,admin.hashPassword);
      if(!validPassword){
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.json({success:false,status:"Wrong password"});
      }
      else if(validPassword){
        //res.setHeader('Content-Type', 'application/json');
        var token = authenticate.getToken({_id: admin._id});
        //res.setHeader('Content-Type', 'application/json');
        //localStorage.setItem('admintoken', token);
        res.cookie('admintoken', token);
        res.cookie('userId', admin._id);
        //res.send({success: true,status:'You are authenticated!',token:token});
        res.redirect('/');
      }
    }
});
  



  
/*router.put('/updateDetails',authenticate.verifyUser, (req, res, next) => {
  AlumniBasicDetails.findByIdAndUpdate(req.params.dishId, {
      $set: req.body
  }, { new: true })
  .then((dish) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(dish);
  }, (err) => next(err))
  .catch((err) => next(err));
}) */


 
router.delete('/deleteuser/:id',[presentVerifying,authenticate.verifyUser], async (req, res, next) => {
  const id = req.params.id;
  console.log(id);

  const admin = await AdminDetails.findById(req.cookies.userId);
  //console.log("---------------------------------------Type is-----------------------------------------------------------")
  //console.log(typeof(admin));
  if(typeof(admin)!==undefined){

    //for deleting the alumni image from the cloudinary database
    const alumni = await AlumniBasicDetails.findById(req.params.id);
    imageFilename = alumni.alumniImage.filename;

    if(alumni.alumniImage.url!=="https://res.cloudinary.com/dzxf40jom/image/upload/v1621967741/Alumni/gdqldyoge92sbmdw2ein.png"){
      await cloudinary.uploader.destroy(imageFilename);
    }


    await AlumniBasicDetails.findOneAndRemove({_id: id },
      function (err, docs) {
        if (err){
          console.log(err)
        }
        else{
          console.log("Removed User : ", docs);
        }
    });


    res.redirect('/');

  }
  else{
    res.setHeader('Content-Type', 'application/json');
    res.send({success: true,status:'You are authenticated! to delete alumni'});
  }

});




/*----------------------------------------------Admin performs CRUD on events-----------------------------------------------------------------*/
/*----------Each time an alumni clicks on attend event he will only update the attendies array of event model----------------------------------*/


router.get('/createEvent',[presentVerifying,authenticate.verifyUser],function(req,res){
  res.render('../views/mainpage/events/new.ejs');
});

router.post('/createdEvent',[presentVerifying,authenticate.verifyUser],(req, res, next) => {

  Event.findOne({title : req.body.title , date : req.body.date , day : req.body.day , month : req.body.month , year : req.body.year },async function(err,event){
    if(err) {
      console.log("inside");
      console.log(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }   
    else if(event){
      res.statusCode = 400;
      res.setHeader('Content-Type','application/json');
      res.json({success: false,status:'This Event has already been created'});
    }
    else{
      newEvent = new Event({
        title : req.body.title, 
        description : req.body.description, 
        time : req.body.time,
        date : req.body.date,
        day : req.body.day,
        month : req.body.month,
        year : req.body.year,
        location:req.body.location,
        attendies : []
      });
    
      await newEvent.save((err)=>{
        if(err){
          console.log(err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
        }
      });
      
      res.statusCode = 200;
      res.redirect('/events');
    }
  })

});

router.get('/editEvent/:event_id',[presentVerifying,authenticate.verifyUser],async function(req,res){
  const event = await Event.findById(req.params.event_id)
  res.render('../views/mainpage/events/edit.ejs',{event:event});
});



router.put('/editedEvent/:event_id',[presentVerifying,authenticate.verifyUser], async (req, res, next) => {

  console.log(req.body.description);
  const update = await Event.findByIdAndUpdate(req.params.event_id, {
    title : req.body.title, 
    description : req.body.description, 
    time : req.body.time,
    date : req.body.date,
    day : req.body.day,
    month : req.body.month,
    year : req.body.year,
    location:req.body.location
  }, { new: true })
  .then((eventEdited) => {
      res.statusCode = 200;
      res.redirect('/events');
  }, (err) => next(err))
  .catch((err) => next(err))
});




router.delete('/deleteEvent/:event_id',[presentVerifying,authenticate.verifyUser], async (req, res, next) => {
  //const id = req.params.id;
  //console.log(id);

  const event = await Event.findById(req.params.event_id);

  await Event.findOneAndRemove({_id: req.params.event_id },
    function (err, event) {
      if (err){
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({error: err});   
        //console.log(err)
      }
      else{
        //console.log("Removed Posted Job");
        res.redirect('/events');
      }
  });
  
});






/*-------------------------------------------Send emails to all the alumni frequently about events-------------------------------------*/

let transport = nodemailer.createTransport({
  //  host: 'smtp.mailtrap.io',
    service : 'gmail',
  //  port: 2525,
    auth: {
       user: process.env.EMAIL,
       pass: process.env.EMAIL_KEY
    }
  });
  
  
  
  //send mail
  router.post('/sendmail', async function(req, res) {
    console.log('sending email..');
    email = []
    const alumni = await AlumniBasicDetails.find();
    for(var i=0;i<alumni.length;i++){
      email.push(alumni[i].alumniEmail);
    }

    const message = {
      from: "testalumniapp@gmail.com", // Sender address
      to: email,         // recipients
      subject: req.body.subject, // Subject line
      text: req.body.message // Plain text body
    };
    transport.sendMail(message, function(err, info) {
        if (err) {
          console.log(err)
          res.send(err);
        } else {
          console.log('mail has sent.');
          console.log(info);
          res.redirect("/admin/details");
        }
    });
  
  });








/*----------------------------------------------------------Logging out admin----------------------------------------------------------*/

router.get('/logout', (req, res) => {
  console.log(req.headers);

  res.setHeader('Content-Type','application/json');
  res.cookie('admintoken','');
  res.cookie('userId','');
  //res.json({success: true,status:"Logged Out Successfully"});
  res.redirect('/');
});

module.exports = router;
