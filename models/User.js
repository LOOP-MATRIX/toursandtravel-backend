const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone:{
        type:String,unique:true
    },
    isAdmin: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);
