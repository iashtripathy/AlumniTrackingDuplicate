var AlumniBasicDetails = require('./models/alumniBasicDetailsModel');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config.js');
var LocalStorage = require('node-localstorage').LocalStorage;
var localStorage = LocalStorage('./tokens');

exports.getToken = function(user) {
    return jwt.sign(user, process.env.SECRET_KEY ,
        /*{expiresIn: "60s"}*/ );
};


exports.verifyUser = function(req,res,next){
    
    //console.log("Name "+req.name);   
    //console.log("TOKEN IS FOUND HERE-------",req.headers.authorization);
    var token;
    //console.log({token});
     if(req.name == "undefined"){
     }
     else if(req.name == 'alumni'){
        token = req.cookies.alumnitoken;
     }
     else if(req.name == 'admin'){
        token = req.cookies.admintoken;
     }
    //console.log(token);
    if(!token){
        res.statusCode = 400;
        res.setHeader('Content-Type','application/json');
        //alert("hello");
        res.json({success:false,status:'Access denied No token found'+" Login and try again"});
        //res.redirect('/alumni/login');
    }
    if(token){
        try{
            const tokenDecoded = jwt.verify(token,process.env.SECRET_KEY);
            //console.log(tokenDecoded);
            //user is useful in /surrentUserDetails route
            req.user = tokenDecoded;
            next();
        }
        catch(err){
            console.log(err);
            res.statusCode = 400;
            //res.setHeader('Content-Type','application/json');
            res.json({success:false,status:'Invalid Token'});
        }
    }
    // next();

    
    
}