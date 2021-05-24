const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = Schema({
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    }, // no longer unique...
    time: { 
        type: String, 
        required: true 
    }, // validate on front end
    date: {
        type: String, 
        required: true         
    },
    day: {
        type: String, 
        required: true 
    },
    month: {
        type: String, 
        required: true 
    },
    year: {
        type: String, 
        required: true 
    },
    location: { 
        type: String , 
        required: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    attendies : []

});

var eventModel = mongoose.model('EventModel', eventSchema);
module.exports = eventModel;