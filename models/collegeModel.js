const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var collegeSchema = new Schema({
    collegeId: {
        type: String,
        required: true,
        unique: true
    },
    collegeName: {
        type: String,
        required: true
    },
    collegeAddress: {
        type: String,
        required: true
    },
    collegePhoneNo: {
        type: Number,
        required: true
    }
});
var collegesInfo = mongoose.model('Colleges', collegeSchema);

module.exports = collegeInfo;