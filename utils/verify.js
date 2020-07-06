const User = require('../models/Users');
const Company = require('../models/Company');


const verificar = {

    user: async (user) => {
        const {id} = user;
        return await User.findOne({_id: id, delete: false}) ? true : false ;
    }
}

module.exports = verificar;




