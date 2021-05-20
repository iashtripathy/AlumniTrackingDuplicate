const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobSchema = Schema({
    title: { type: String, required: true },
    link: { type: String, required: true }, // no longer unique...
    Experience: { type: String, required: true }, // validate on front end
    notes: { type: String },
    tags: { type: Array, default: [] },
    uploadedByUserId: { type: Schema.Types.ObjectId, required: true },  
    uploadedByUserName: { type: String, required: true},
    created: { type: Date, default: Date.now },
});

var jobModel = mongoose.model('JobModel', jobSchema);
module.exports = jobModel;