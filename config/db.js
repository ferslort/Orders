const mongoose = require('mongoose');
require('dotenv').config();

const conectarDB = async() =>{

    try {

        await mongoose.connect(process.env.DB_MONGO, {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        })

        console.log("DB contectada");
        
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

module.exports = conectarDB;