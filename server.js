const Hapi = require('hapi')

const Server = new Hapi.Server(); 

Server.connection({
    host: '0.0.0.0'
    ,port: process.env.PORT || 8080   
});

Server.route({
    method: 'GET'
    ,path: '/'
    ,handler: (req,reply) => {
        reply('Hello World');
    } 
});

Server.start(() => {
    console.log('Server running at: ', Server.info.uri);
})



