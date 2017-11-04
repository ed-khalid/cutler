const Hapi = require('hapi')
const Wreck = require('wreck');
const config = require('./config'); 

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
            && query['hub.verify_token'] == config('VERIFY_TOKEN')  
        ) {
            reply(query['hub.challenge']).code(200);
        } 
        else {
            reply('Verification Token Mismatch').code(403);
        }
    } 
}); 

Server.route({

    method: 'POST'
    ,path:  '/'
    ,handler: (req,reply) => {
        let payload = req.payload;
        console.log(payload);
        if (payload['object'] === 'page') {
            payload['entry'].forEach(entry => {
                entry['messaging'].forEach(event => {
                    if (event['message']) {
                        let sender_id = event['sender']['id'] 
                        let recipient_id = event['recipient']['id'] 
                        let msg = event['message']['text'] 
                        Wreck.post( 
                            `https://graph.facebook.com/v2.6/me/messages?access_token=${config('PAGE_ACCESS_TOKEN')}`
                            ,{payload: {
                                "recipient" : {"id" :  sender_id  }
                                ,"message": {"text" :  "Wassup My Boi?" } }
                            }
                            ,(err,res,payload) => {
                                if (err) console.error('ERROR: ' +err)
                                    if (res) console.log(res);

                            }
                        )
                    }
                })
            })
        }
        reply('OK').code(200);
    }
});


Server.start(() => {
    console.log('Server running at: ', Server.info.uri);
})



