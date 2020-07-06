const {ApolloServer} = require('apollo-server');
const resolvers= require('./ApolloServer/resolvers');
const typeDefs = require('./ApolloServer/schema');
const contectarDB = require('./config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

//conexion a la base de datos
contectarDB();

//definir el server
const server = new ApolloServer({typeDefs, resolvers, context:  async ({req}) => {
    // console.log(req.headers['authorization'])

    const token =  req.headers['authorization'] || '';

    if(token){
        try {

            let usuario = await jwt.verify(token.replace('Bearer ', ''), process.env.KEY_SECRECT);
            return usuario
            
        } catch (error) {
            console.log(error);
        }
    }
}});




//arrancar el servidor
server.listen({port: process.env.PORT || 4000}).then(({url}) => {
    console.log(`🚀  Server ready at ${url}`)
});