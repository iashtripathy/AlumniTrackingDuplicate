const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var alumniBasicDetailsSchema = new Schema({
    alumniName: {
        type: String,
        required: true
    },
    alumniRollNo: {
        type: String,
        required : true
    }, 
    alumniEmail: {
        type: String,
        required: true,
        unique: true
    },
    alumniImage:{
        url : String,
        filename : String
    },
/*     alumniPassword: {
        type: String,
        required: true,
        unique: true   
    }, */
    hashPassword:{
        type:String
    },
    alumniDegree:{
        type: String,
        required: true
    },
    alumniBranch: {
        type: String,
        required: true
    },
    alumniGraduationYear: {
        type: String,
        required: true
    },
    alumniAddress: {
        type: String,
        required: true
    },  
    alumniCurrentWorkingCompany: {
        type: String,
        required: true
    },
    alumniDesignation: {
        type: String,
        required: true
    },
    alumniWorkExperience :{
        type: String,
        required: true        
    },
    alumniCurrentLocationCity: {
        type: String,
        required: true        
    },
    alumniCurrentLocationZip: {
        type: String,
        required: true        
    },
    alumniCurrentLocationState: {
        type: String,
        required: true        
    },
    alumniCurrentLocationCountry: {
        type: String,
        required: true        
    },
    alumniHigherEducation :{
        type : String,
        required : true
    },
    alumniSkills :{
        type : String,
        required : true
    },
    alumniWebsite:{
        type : String,
        required : true
    },
    alumniLinkedin :{
        type : String,
        required : true
    },
    alumniGithub :{
        type : String,
        required : true
    },
    alumniInstagram :{
        type : String,
        required : true
    },
    alumniFacebook :{
        type : String,
        required : true
    },
    alumniTwitter :{
        type : String,
        required : true
    },
    isVerified:{ 
        type: Boolean, 
        default: false 
    }
});

//alumniBasicDetailsSchema.plugin(passportLocalMongoose);

var alumniBasicDetails = mongoose.model('AlumniBasicDetails', alumniBasicDetailsSchema);

module.exports = alumniBasicDetails;