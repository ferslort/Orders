const mongoose = require('mongoose')


const FileSchema = mongoose.Schema({
  filename: String,
  mimetype: String,
  path: String,
  idUser:{
    type: mongoose.Types.ObjectId,
    ref: 'User'
  }
});


module.exports = mongoose.model('File', FileSchema)