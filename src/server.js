const Hapi = require('hapi')
const config = require('../config'); 
const CapitalOne = require('./capitalOne');
const Moment = require('moment');
const Cutler = require('./cutler')


const Server = new Hapi.Server(); 


Server.connection({
    host: '0.0.0.0'
    ,port: process.env.PORT || 8080   
});

//first time authenticating cutler 
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

                        if (msg == 'How Much Did I Spend This Month?') {
                            let month =  Moment().month(); 
                            CapitalOne.listTransactionsMonth(sender_id,month).then(amount => {
                                Cutler.talk(sender_id, 'You spent $' + amount +' this month.');
                            }) ;
                        }
                        else {
                            Cutler.talk(sender_id, "DON'T CAAAARE!");
                        }
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



