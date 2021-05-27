const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var alumniBasicDetailsSchema = new Schema({
    collegeName: {
        type: String,
        required: true
    },
    alumniName: {
        type: String,
        required: true
    },
    alumniRollNo: {
        type: String,
        required: true,
        unique : true
    },
    alumniEmail:{
        type: String,
        required: true,
        unique: true
    },
    alumniImage:{
        url : String,
        filename : String
    },
    alumniPassword: {
        type: String,
        required: true,
        unique: true   
    },
    hashPassword:{
        type:String
    },
    isVerified:{ 
        type: Boolean, 
        default: false 
    },
    passwordResetToken:{
        type:String
    },
    passowrdResetExpires : Date
});

//alumniBasicDetailsSchema.plugin(passportLocalMongoose);

var alumniBasicDetails = mongoose.model('AlumniBasicDetails', alumniBasicDetailsSchema);

module.exports = alumniBasicDetails;