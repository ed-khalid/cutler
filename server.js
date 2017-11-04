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
        let query = req.query; 
        if (query['hub.mode'] === 'subscribe' 
             && query['hub.challenge'] 
            && query['hub.verify_token'] == process.env.VERIFY_TOKEN  
        ) {
            reply(query['hub.challenge']).code(200);
        } 
        else {
            reply('Verification Token Mismatch').code(403);
        }
    } 
});

Server.start(() => {
    console.log('Server running at: ', Server.info.uri);
})



