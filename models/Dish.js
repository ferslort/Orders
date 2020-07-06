const mongoose = require('mongoose');

const DishSchema = mongoose.Schema({

    name:{
        type: String,
        trim: true,
        require: true
    },
    price:{
        type: Number,
        trim: true,
        require: true
    },
    avatar:{
        type:String,
        require: true
    },
    category:{
        type: String,
        require: true
    },
    detail:{
        type: String,
        trim: true
    },
    registration:{
        type: Date,
        default: Date.now()
    },
    delete:{
        type:Boolean,
        default: false
    },
    company:{
        type: mongoose.Types.ObjectId,
        ref: 'Company'
    },
    active:{
        type: Boolean,
        default: true
    },
    status:{
        type: String,
        default: "stock"
    }

})

module.exports = mongoose.model('Dish', DishSchema);