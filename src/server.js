'use strict'

const Hapi = require('hapi')
const config = require('../config');
const CapitalOne = require('./capitalOne');
const Moment = require('moment');
const Cutler = require('./cutler')

var wit = require('./services/wit').getWit()

// LETS SAVE USER SESSIONS
var sessions = {}

var findOrCreateSession = function (fbid) {
  var sessionId

  // DOES USER SESSION ALREADY EXIST?
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // YUP
      sessionId = k
    }
  })

  // No session so we will create one
  if (!sessionId) {
    sessionId = new Date().toISOString()
    sessions[sessionId] = {
      fbid: fbid,
      context: {
        _fbid_: fbid
      }
    }
  }

  return sessionId


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
        if (payload['object'] === 'page') {
            payload['entry'].forEach(entry => {
                entry['messaging'].forEach(event => {
                    if (event['message']) {
<<<<<<< Updated upstream
                        let sender_id = event['sender']['id'] 
                        console.log('sender is ' + sender_id);
                        let recipient_id = event['recipient']['id'] 
                        console.log('recipient is ' + recipient_id);
                        let msg = event['message']['text'] 

                        if (msg == 'How Much Did I Spend This Month?') {
                            let month =  Moment().month(); 
                            return CapitalOne.listTransactionsMonth(sender_id,month).then(amount => {
                                return Cutler.talk(sender_id, 'You spent $' + amount +' this month.')
=======
                        let sender_id = event['sender']['id']
                        let recipient_id = event['recipient']['id']
                        let msg = event['message']['text']

                        if (msg == 'Am I within budget this month?') {
                            let month =  Moment().month();
                            CapitalOne.listTransactionsMonth(sender_id,month).then(amount => {
                                Cutler.talk(sender_id, 'You spent $' + amount +' this month.');
>>>>>>> Stashed changes
                            }) ;
                        }

                        if (msg == 'What can I buy with my reward points?') {
                            let month =  Moment().month();
                            CapitalOne.listRewards(sender_id).then(amount => {

                              message = 'Your have have ' + amount + ' of points to spend. Would you like a recommendation based off your purchase history?'

                                Cutler.talk(sender_id, message);
                            }) ;
                        }

                        if (msg == "Lower Jimmy's allowance by $50 dollars.") {
                            let month =  Moment().month();
                            CapitalOne.getAllowance(sender_id).then(amount => {
                                    CapitalOne.setAllowance(sender_id, amount-50).then(res => {

                              message = "You have set Jimmy's allowance to " + (amount-50) + ' from ' + amount + "."

                                Cutler.talk(sender_id, message);
                            }) ;
                        })
                        else {
<<<<<<< Updated upstream
                            return Cutler.talk(sender_id, "ADIOS"); 
=======
                            Cutler.talk(sender_id, "I'm sorry I cannot help with that.");
>>>>>>> Stashed changes
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
