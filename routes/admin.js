if(process.env.NODE_ENV !=="production"){
  require('dotenv').config();
}


var express = require('express');
const bodyParser = require('body-parser');
var AdminDetails = require('../models/adminModel');
var AlumniBasicDetails = require('../models/alumniBasicDetailsModel');
var Event = require('../models/eventsModel');
const Blog = require('../models/blogModel')
const Job = require('../models/jobModel');
var Token = require('../models/tokenModel');
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




//Admin Details page => send mails to all 
router.get('/details',[presentVerifying,authenticate.verifyUser],async function(req,res){
  let userType = new Map()
  userType['alumni'] = false;
  userType['admin'] = false;
  userType['viewer'] = false;
  let user;
  const alumnis = await AlumniBasicDetails.find({}).select(['-alumniPassword','-hashPassword']);
/*   const events = await Event.find() */
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



/* router.post('/register', (req, res, next) => {
  console.log("Registrating");
  console.log(req.body);
  AdminDetails.findOne({email:req.body.email, password:req.body.password},async function(err,admin){
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
 */




router.get('/login',function(req,res){
    res.render('adminLogin',{type:'login'});
});


router.post('/login',async function(req,res){
  console.log(req.body.username);
  var admin = await AdminDetails.findOne({email: req.body.email});
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
  

/*--------------------------------------------------------------Forgot Password Beginning----------------------------------------------------------*/

//When the user clicks on forgot password this is the page rendered.
router.get('/forgotPassword',function(req,res,next){
  res.render('adminLogin',{type : 'forgotPassword'})
})


//This post request is made when the user enters his registered email id to change the password.Now here the password changing link is sent to user
router.post('/forgotPassword',async function(req,res,next){

  AdminDetails.findOne({email:req.body.email},async function(err,admin){

    if(err) {
      //console.log("inside");
      console.log(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else if(admin){
      var token = authenticate.getToken({_id: admin._id});
      var saveToken = new Token({_userId:admin._id , token:token });

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
          text: 'Please click on the link to change password: \nhttp:\/\/' + req.headers.host + '\/admin' + '\/changePassword\/' + saveToken.token + '\/' + req.body.email + '.\n'
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
      res.json({success: false, status: 'Admin with the entered email isnt found.Please go back and try again'});      
    }
  })
 /*  else{
    res.status = 500;
    res.send({result:"No alumni with the entered email found.Please recheck the email and try again!"});
  } */
})



//This renders the page where user enters the new password.This stages is reached immediately after the link is verifies through email by the alumni
router.get('/changePassword/:token/:regEmail',function(req,res,next){
  AdminDetails.findOne({email : req.params.regEmail},function(err,admin){
    if(err){
      console.log(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});      
    }
    else if(admin){
      Token.findOne({ token: req.params.token }, function (err, token) {
        if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token for the Email Id. Your token my have expired.' });
    
        res.render('adminLogin',{type : 'changePassword',email: req.params.regEmail })
      }); 
    }
    else{
      res.status = 200
      res.send({success: false, status: 'Admin with the entered email isnt found.Please go back and try again'})
    }
  })


})


//Final put request to update the password after the user enters the new password and hits submit

router.put('/updatePassword',async function(req,res,next){
  console.log(req.body.email);
  
  // Verify and save the user
  //alumni.alumniPassword = req.body.password;
  await AdminDetails.findOne({email : req.body.email},async function(err,admin){
    if(err) {
      //console.log("inside");
      console.log(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else if(admin){
      const salt = await bcrypt.genSalt(10);
      hashPassword = await bcrypt.hash(req.body.password,salt);
      const update = await AdminDetails.findByIdAndUpdate(admin._id, {
        $set : {hashPassword : hashPassword}
      }, { new: true })
        .then((admin) => {
    
    
          Token.findOneAndRemove({_userId : admin._id },
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
          res.redirect('/admin/login');
      }, (err) => next(err))
        .catch((err) => console.log("Here is errror",err)
      )
    
    }
    else{

    }
  });


 

})


/*--------------------------------------------------------------Forgot Password Ending----------------------------------------------------------*/


 
router.delete('/deleteuser/:id',[presentVerifying,authenticate.verifyUser], async (req, res, next) => {
  const id = req.params.id;
  console.log(id);

  const admin = await AdminDetails.findById(req.cookies.userId);
  //const blogs = await Blog.find({userId :  id });
  //const job = await Job.find({uploadedByUserId: req.params.id});


  //console.log("---------------------------------------Type is-----------------------------------------------------------")
  //console.log(typeof(admin));
  if(typeof(admin)!==undefined){

    //for deleting the alumni image from the cloudinary database
    const alumni = await AlumniBasicDetails.findById(req.params.id);
    const email = alumni.alumniEmail;    
    imageFilename = alumni.alumniImage.filename;

    if(alumni.alumniImage.url!=="https://res.cloudinary.com/dzxf40jom/image/upload/v1621967741/Alumni/gdqldyoge92sbmdw2ein.png"){
      await cloudinary.uploader.destroy(imageFilename);
    }

    await Blog.deleteMany({userId :  id }).then(function(){
      console.log("All blogs posted by this user deleted"); // Success
    }).catch(function(error){
        console.log(error); // Failure
    });

    await Job.deleteMany({uploadedByUserId :  id }).then(function(){
      console.log("All jobs posted by this user deleted"); // Success
    }).catch(function(error){
        console.log(error); // Failure
    });

    Event.find({},function(err,events){

      if(err) {
        //console.log("inside");
        console.log(err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({err: err});
      }
      else{
        for(var i=0;i<events.length;i++){
          if(events[i].attendies.find(emailId => emailId === email)!== "undefined"){
            var index = events[i].attendies.indexOf(email)
            events[i].attendies.splice(index)
          }
          events[i].save(function (err) {
            if (err) return handleError(err);
            // saved!
          })
        }

      }

    })

    //Event.updateMany( {}, { $pullAll: {attendies: [email] } } )

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
    var temp = req.body.recipients
    temp = temp.toLowerCase()
    var end;
    if(temp!=="all"){
      await Event.findById({_id : req.body.recipients},async function(err,event){
        if(err) {
          //console.log("inside");
          console.log(err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
        }   
        else if(event){
          //console.log()
          end = event.attendies.length
          for(var i=0;i<end;i++){
            email.push(event.attendies[i]);
          }
        }
        else{
          res.json({success: failed, status: 'No event with the entered Id could be found'});
        }
      });

    }
    else if(temp==="all"){
      end = alumni.length
      for(var i=0;i<end;i++){
        email.push(alumni[i].alumniEmail);
      }
    }
    if(email.length>=1){
      console.log("Emails are : ",email);
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
    }
    else{
      //text = "No Attendies for this event!!\n" + 'Please click on the below link to go back to the page: \nhttp:\/\/' + req.headers.host + '\/admin' + '\/details\/' + '.\n'
      res.send("No Attendies for this event!!")
    }

  
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
