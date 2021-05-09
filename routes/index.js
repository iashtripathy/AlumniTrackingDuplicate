var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
var AlumniBasicDetails = require('../models/alumniBasicDetailsModel');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('../views/mainpage/index.ejs');
});

router.get('/index',function(req,res){
  res.redirect('/');
});

router.get('/images',function(req,res){
  res.render('../views/mainpage/images.ejs');
});

router.get('/stories',function(req,res){
  res.render('../views/mainpage/stories.ejs');
});

router.get('/contact',function(req,res){
  res.render('../views/mainpage/contact.ejs');
});

router.get('/team',function(req,res){
  res.render('../views/mainpage/team.ejs');
});

router.get('/services',async function(req,res){
  const users = await AlumniBasicDetails.find({}).select(['-alumniPassword','-hashPassword']);
  res.render('../views/mainpage/services.ejs',{records : users});
});

router.get('/events',function(req,res){
  res.render('../views/mainpage/events.ejs');
});

router.get('/storySingle',function(req,res){
  res.render('../views/mainpage/storySingle.ejs');
});
module.exports = router;
