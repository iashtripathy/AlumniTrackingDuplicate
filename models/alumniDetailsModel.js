const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var alumniDetailsSchema = new Schema({
    alumniName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    dob: {
        type: Date,
        required: true
    },
    currentAddress: {
        type: String,
        required: true
    },
    permanentAddress: {
        type: String,
        required: true
    },
    Interests: {
       hackathons: {type: Boolean,default:false},
       webinars: {type: Boolean,default:false},
       others: {type: Boolean,default:false},
    },
    branch: {
        type: String,
        required: true
    },
    passedOutYear: {
        type: String,
        required: true
    },
    currentWorkingPlace: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'basic',
        enum: ["basic", "supervisor", "admin"]
    },

});
var alumniDetails = mongoose.model('AlumniDetails', alumniDetailsSchema);

module.exports = alumniDetails;