const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobSchema = Schema({
    title: { 
        type: String, 
        required: true 
    },
    link: { 
        type: String, 
        required: true 
    }, // no longer unique...
    experience: { 
        type: String, 
        required: true 
    }, // validate on front end
    location: { 
        type: String , 
        required: true
    },

    /*uploadedByname,companyname should be added*/
    tags: { 
        type: Array, 
        default: [] 
    },
    uploadedByUserId: { 
        type: String, 
        required: true 
    },  
    companylogo: {  
        url : String , 
        filename : String
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
});

var jobModel = mongoose.model('JobModel', jobSchema);
module.exports = jobModel;