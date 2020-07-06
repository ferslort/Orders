const mongoose = require ('mongoose');

const UploadFile = mongoose.Schema({
    filename: String,
    mimetype: String,
    path: String,
})

const UserShema = mongoose.Schema({

    name:{
        type: String,
        trim: true,
        require: true
    },
    lastname:{
        type: String,
        trim: true
    },
    phone:{
        type: String,
        trim: true,
        require: true,
        unique: true
    },
    email:{
        type:String,
        trim: true,
        require: true,
        unique: true
    },
    avatar: {
        type:Object,
    },

    // file: [UploadFile],
    
    password:{
        type: String,
        require: true,
        trim: true
    },
    rol:{
        type: String,
        require: true,
        default: 'MESERO'
    },
    company:{
        type: mongoose.Types.ObjectId,
        ref: 'Company'
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

module.exports = mongoose.model('User', UserShema );