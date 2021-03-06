
const Wit = require('node-wit');


const sessions = {}; 

const findOrCreateSessions = (fbid) => {
    let sessionId;
    Object.keys(sessions).forEach(k =>{
        if (sessions[k].fbid == fbid ) {
            sessionId = k;
        }
    })
    if (!sessionId) {
        sessionId = new  Date().toISOString(); 
        sessions[sessionId] = {fbid: fbid, context:{}}
    }
    return sessionId;
}

const actions = {
    send({sessionId}, {text}) {
      // Our bot has something to say!
      // Let's retrieve the Facebook user whose session belongs to
      const recipientId = sessions[sessionId].fbid;
      if (recipientId) {
        // Yay, we found our recipient!
        // Let's forward our bot response to her.
        // We return a promise to let our bot know when we're done sending
        return fbMessage(recipientId, text)
        .then(() => null)
        .catch((err) => {
          console.error(
            'Oops! An error occurred while forwarding the response to',
            recipientId,
            ':',
            err.stack || err
          );
        });
      } else {
        console.error('Oops! Couldn\'t find user for session:', sessionId);
        // Giving the wheel back to our bot
        return Promise.resolve()
      }
    },
    // You should implement your custom actions here
    // See https://wit.ai/docs/quickstart
  };