var AlumniBasicDetails = require('./models/alumniBasicDetailsModel');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config.js');
var LocalStorage = require('node-localstorage').LocalStorage;
var localStorage = LocalStorage('./tokens');

exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey/* ,
        {expiresIn: 3600} */);
};


exports.verifyUser = function(req,res,next){
    //const token = req.header('x-auth-token');
    console.log("Name "+req.name);   
    var token = '';
    if(req.name == "undefined"){

    }
    else if(req.name == 'alumni'){
        token = localStorage.getItem('alumnitoken');
    }
    else if(req.name == 'collegeAdmin'){
        token = localStorage.getItem('collegeAdmintoken');
    }
    else if(req.name == 'directorate'){
        token = localStorage.getItem('directoratetoken');
    } 
    console.log(token);
    if(!token){
        res.statusCode = 400;
        res.setHeader('Content-Type','application/json');
        res.json({success:false,status:'Access denied No token found'});
        //res.redirect('/alumni/login');
    }
    if(token){
        try{
            const tokenDecoded = jwt.verify(token,config.secretKey);
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
    
    
}