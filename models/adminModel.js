const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var adminSchema = new Schema({
    email: {
        type:String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        unique: true
    },
    hashPassword: {
        type: String
    }
});
var adminModel = mongoose.model('AdminLoginDetails', adminSchema);

module.exports = adminModel;