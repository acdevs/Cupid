const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    photo : {
        type: String
    },
    rollNo : {
        type: Number,
        required: true,
        unique: true
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    name : {
        type: String,
        required: true
    },
    gender : {
        type: String,
        required: true,
        enum : ["M", "F", "O"]
    },
    password : {
        type: String,
        required: true
    },
    branch : {
        type: String,
        required: true
    },
    crush : {
        type: String,
    },
    crush_branch : {
        type: String,
    },
    popularity : {
        type: Number,
        default: 0
    },
    instagram_username : {
        type: String,
    },
    snapchat_username : {
        type: String,
    },
    linkedin_username : {
        type: String,
    },
    twitter_username : {
        type: String,
    },
}, {timestamps: true})

const User = mongoose.model('User', userSchema) //singular name of the collection

module.exports = User