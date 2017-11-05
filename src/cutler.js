const Wreck =  require('wreck');  
const config = require('../config');


let _export = {

    talk: (sender_id, message) => {
        Wreck.post( 
            `https://graph.facebook.com/v2.6/me/messages?access_token=${config('PAGE_ACCESS_TOKEN')}`
            ,{payload: {
                "recipient" : {"id" :  sender_id  }
                ,"message": {"text" :  message } }
            }
            ,(err,res,payload) => {
                if (err) console.error('ERROR: ' +err)
                    if (res) console.log(res);
            }
        )
    }  
}




 
