const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var directorateSchema = new Schema({
    username: {
        type: String,
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
var directorateModel = mongoose.model('DirectorateLoginDetails', directorateSchema);

module.exports = directorateModel;