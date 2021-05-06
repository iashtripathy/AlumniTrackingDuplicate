var express = require('express');
const bodyParser = require('body-parser');
var AlumniBasicDetails = require('../models/alumniBasicDetailsModel');
var passport = require('passport');
var bcrypt = require('bcrypt');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = LocalStorage('./tokens');
/* var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt; */
var authenticate = require('../authenticate');

var router = express.Router();
router.use(bodyParser.json());


//
router.get('/',function(req,res,next){

    res.redirect('/alumni/signup');

})
router.get('/register',function(req,res,next){
    //console.log('indise');
    res.render('alumniRegistration');
})

function presentVerifying(req,res,next){
  req.name = 'alumni';
  next();
}
router.get('/currentAlumniDetails',[presentVerifying,authenticate.verifyUser],async function(req,res){
  const alumni = await AlumniBasicDetails.findById(req.user._id).select(['-alumniPassword','-hashPassword','-alumniEmail']);
  res.send(alumni); 
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
    console.log(req.body);
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
        newAlumni = new AlumniBasicDetails({collegeName: req.body.collegeName, alumniName: req.body.alumniName, alumniRollNo: req.body.rollNo, alumniEmail:req.body.email, alumniPassword:req.body.password, hashPassword:req.body.password});
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
         
        localStorage.setItem('alumnitoken', token);

        res.setHeader('Content-Type', 'application/json');
        res.send({success: true,status:'You are authenticated!',token:token});
        //res.send(alumni);
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
router.get('/logout', (req, res) => {
  console.log(req.headers);
  if(localStorage.getItem('alumnitoken') == "undefined"){
    res.setHeader('Content-Type','application/json');
    res.json({status:"Already Logged Out"});
  }
  else if (localStorage.getItem('alumnitoken')) {
    localStorage.removeItem('alumnitoken');
    res.setHeader('Content-Type','application/json');
    res.json({success: true,status:"Logged Out Successfully"});
  }
});

module.exports = router;
