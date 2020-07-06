const mongoose = require('mongoose');
const moment = require('moment');

const OrderSchema = mongoose.Schema({

    pedido:{
        type: Array,
        require: true
    },
     total:{
         type: Number,
         trim: true
     },
     user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
     },
    
     registration:{
         type: Date,
         default: moment().format()
     },

     delete:{
         type: Boolean,
         default: false
     },

     company: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Company'
     },
     detail:{
         type: Object,
         trim: true
     },

     extra:{
         type: String
     },

     typeOrder:{
        type: String
     },

     shortId:{
         type: String
     },
     status:{
         type: String,
         require: true,
         default: 'PENDIENTE'
     },
     paid:{
         type: Boolean,
         default: false
     }


})

module.exports = mongoose.model('Order', OrderSchema);