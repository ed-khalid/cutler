'use strict'

const Hapi = require('hapi')
const config = require('../config');
const CapitalOne = require('./capitalOne');
const Moment = require('moment');
const Cutler = require('./cutler')

let allowanceQuestion = false;
let budgetQuestion = false;
let allowanceMembers = []; 
let allowanceId = undefined;
let verb = '';

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
                        let sender_id = event['sender']['id']
                        console.log('sender is ' + sender_id);
                        let recipient_id = event['recipient']['id']
                        console.log('recipient is ' + recipient_id);
                        let msg = event['message']['text']

                        if (msg.includes('spend') && msg.includes('month')) {
                            let month =  Moment().month();
                            let capitalId = CapitalOne.facebookToCapitalId(sender_id); 
                            return CapitalOne.listTransactionsMonth(capitalId,month).then(amount => {
                                return Cutler.talk(sender_id, 'You spent $' + amount +' this month.')
                            }) ;
                        }

                        else if (msg.toLowerCase().includes('eddie') && !msg.toLowerCase().includes('lower')) {
                            let month = Moment().month(); 
                            CapitalOne.getIdByName(sender_id,'Eddie').then(id => {
                                CapitalOne.listTransactionsByCategory(id).then(cats => {
                                    Cutler.showList(sender_id, cats).then(done => {
                                        Cutler.talk(sender_id, 'Eddie is over budget for Amusement and Enterainment.  (budget is $100 )');
                                    });

                                })
                            })
                        }

                        else if (msg.includes('budget') && (msg.includes('month') ||  msg.includes('within')) &&!msg.includes('set')) {
                            let month =  Moment().month();
                            CapitalOne.checkWithinBudget(sender_id,month).then(resp => {
                                let answer = (resp.answer) ? 'You are within your budget of $' + resp.budget +
                                '. You have spent $' + resp.sum + ' so far this month.'
                                : 'You are over your budget of $' + resp.budget +
                                '. You have spent $' + resp.sum + ' so far this month.';
                                Cutler.talk(sender_id, answer);
                            });
                        }
                        else if (msg.includes('budget') && msg.includes('month') && msg.includes('set')) {
                            let number = msg.match(/\d/g).join('');
                            CapitalOne.setBudgetLimit(sender_id, number).then(resp => {
                                Cutler.talk(sender_id, 'OK. I have set your budget to  $' + number);
                            })
                        }

                        else if (msg.toLowerCase().includes('lower') && msg.toLowerCase().includes('eddie') 
                             && msg.toLowerCase().includes('allowance')
                        ) {
                            let limit = msg.match(/\d/g).join(''); 
                            CapitalOne.getIdByName(sender_id, 'Eddie').then(id => {
                              CapitalOne.setAllowanceLimit(id,100-limit).then(done => {
                                  Cutler.talk(sender_id, "OK, Eddie's limit has been set to " + (100-limit));
                              })
                            })
                        }

                        else if ( (msg.includes('family') || msg.includes('members')) && (msg.includes('show') || msg.includes('list')) ) {
                            CapitalOne.listFamilyMembers(sender_id).then(fam => {
                                  let newFam = fam.slice(1); 
                                  Cutler.showList(sender_id, newFam).then(done => {
                                      let notFound = fam.find(it => it.subtitle.includes('not set'))
                                      if (notFound)  {
                                          allowanceQuestion = true;
                                          Cutler.talk(sender_id, 'Would you like to set up allowances?');
                                      }

                                  })
                            }, err => {
                                console.log(err);
                                Cutler.talk(sender_id, "I don't know how to respond to do that. Sorry.");
                            })

                        }

                        else if (msg.toLowerCase().includes('yes')) {
                            if (allowanceQuestion) {
                                allowanceQuestion = false;
                                CapitalOne.getUnrestrictedMembers(sender_id).then(members => {
                                    allowanceMembers = members;
                                    let member = allowanceMembers.pop(); 
                                    verb = 'Allowances'; 
                                    allowanceId = member.id; 
                                    Cutler.talk(sender_id, 'Enter allowance for ' + member.title); 
                                    })
                            }
                            else if (budgetQuestion) {
                                budgetQuestion = false;
                                verb = 'Budget';
                                CapitalOne.getMyself(sender_id).then(member =>{
                                    allowanceId = member.id;
                                    Cutler.talk(sender_id, 'Enter your budget for this month?');
                                })
                            }
                            else {
                                Cutler.talk(sender_id ,'OK');
                            }
                        }
                        else if(allowanceId) {
                            let amount = msg.match(/\d/g).join(''); 
                            CapitalOne.setAllowanceLimit(allowanceId, amount).then(done => {
                                let member = allowanceMembers.pop(); 
                                if (member) {
                                    allowanceId = member.id; 
                                    Cutler.talk(sender_id, 'Enter allowance for ' + member.title); 
                                } 
                                else {
                                  allowanceId = null; 
                                  Cutler.talk(sender_id, verb + ' set.');
                                }
                            })
                        }
                        else if (allowanceQuestion) {
                            allowanceQuestion = false;
                            Cutler.talk(sender_id, 'OK.')
                        }
                        else if (msg.toLowerCase().includes('reward')) {
                            let month =  Moment().month();
                            CapitalOne.listRewards(sender_id).then(amount => {
                              message = 'You have ' + amount + ' of points to spend.'
                              Cutler.talk(sender_id, message);
                            }) ;
                        }

                        else if (msg.toLowerCase().includes('categories') || msg.toLowerCase().includes('breakdown')) {
                            let month =  Moment().month();
                            CapitalOne.listTransactionsByCategory(sender_id, month).then(categories => {
                                Cutler.showList(sender_id, categories);
                            });
                        }
                        else if (msg == "Lower Jimmy's allowance by $50 dollars.") {
                            let month =  Moment().month();
                            CapitalOne.getAllowance(sender_id).then(amount => {
                               CapitalOne.setAllowance(sender_id, amount-50).then(res => {
                                  message = "You have set Jimmy's allowance to " + (amount-50) + ' from ' + amount + "."
                                  Cutler.talk(sender_id, message);
                            });
                          })
                        }



                        else {
                            return Cutler.talk(sender_id, "Hello!");
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
});
