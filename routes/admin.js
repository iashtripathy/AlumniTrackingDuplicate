var express = require('express');
const bodyParser = require('body-parser');
var AdminDetails = require('../models/adminModel');
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
    res.render('adminLogin');
})
function presentVerifying(req,res,next){
  req.name = 'admin';
  next();
}
/* router.get('/currentAlumniDetails',[presentVerifying,authenticate.verifyUser],async function(req,res){
  const alumni = await AlumniBasicDetails.findById(req.user._id).select(['-alumniPassword','-hashPassword','-alumniEmail']);
  res.send(alumni); 
});
 */


/* GET users listing. */
//authenticate.verifyUser,
/* router.get('/getdetails/:password',authenticate.verifyUser,(req,res,next) => {
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
}); */

router.get('/getusers',[presentVerifying,authenticate.verifyUser],async function(req,res,next){
  const users = await AlumniBasicDetails.find({});
  res.status(200).json({
    data: users
  });
  res.send(data); 
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
         
        localStorage.setItem('admintoken', token);

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
  if(localStorage.getItem('admintoken') == "undefined"){
    res.setHeader('Content-Type','application/json');
    res.json({status:"Already Logged Out"});
  }
  else if (localStorage.getItem('admintoken')) {
    localStorage.removeItem('admintoken');
    res.setHeader('Content-Type','application/json');
    res.json({success: true,status:"Logged Out Successfully"});
  }
});

module.exports = router;
