const mongoose = require('mongoose');

const CompanySchema = mongoose.Schema({

    name:{
        type: String,
        trim: true,
        require: true
    },
    lastname:{
        type: String,
        trim: true
    },
    idcompany:{
        type: String,
        trim: true,
        require: true
    },
    giro:{
        type:String,
        trim: true,
        require:true
    },
    address:{
        type:String,
        trim: true,
        require: true
    },
    avatar:{
        type: String,
        trim: true
    },
    phone:{
        type:String,
        trim: true,
        require: true,
        unique:true
    },
    email:{
        type: String,
        trim: true,
        require: true,
        unique: true
    },
    rol:{
        type: String,
        default:'admin'
    },
    active:{
        type: Boolean,
        default: false
    },
    delete:{
        type: Boolean,
        default: false
    },
    registration:{
        type: Date,
        default: Date.now()
    }

})

module.exports = mongoose.model('Company', CompanySchema)