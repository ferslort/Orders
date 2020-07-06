const mongoose = require('mongoose');

const ProductSchema = mongoose.Schema({

    name:{
        type: String,
        trim: true,
        require: true
    },
    qly:{
        type: Number,
        trim: true,
        require: true
    },
    avatar:{
        type: String
    },
    detail:{
        type: String,
        trim: true
    },
    category:{
        type: String,
        trim: true
    },
    unidad:{
        type: String,
        require: true
    },
    inventary:{
        type: Boolean,
        default: false
    },
    company:{
        type: mongoose.Types.ObjectId,
        ref: 'Company'
    },
    registration: {
        type: Date,
        default: Date.now()
    },
    delete:{
        type: Boolean,
        default: false   
    },
    status:{
        type: String,
        default: 'stock'
    },
    active:{
        type: Boolean,
        default: true
    }

})

module.exports = mongoose.model('Product', ProductSchema);