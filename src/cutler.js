const Wreck =  require('wreck');  
const config = require('../config');


let _export = {

    talk: (sender_id, message) => {
        return Wreck.post( 
            `https://graph.facebook.com/v2.6/me/messages?access_token=${config('PAGE_ACCESS_TOKEN')}`
            ,{payload: {
                "recipient" : {"id" :  sender_id  }
                ,"message": {"text" :  message } }
            }
        )
    }  
    ,showList: (sender_id, list) => {
        let _elements = list.map(el => {
            return {
                "title": el.title
                ,"subtitle": el.subtitle 
            }
        })
        let payload = {
                "recipient" : {"id" :  sender_id  }
                ,"message": {"attachment" :  {
                    "type":"template"
                    ,"payload": {
                        "template_type": "list"
                        ,"top_element_style": "compact"
                        ,"elements" : _elements
                    }
                }
            }
        }
        return Wreck.post(
            `https://graph.facebook.com/v2.6/me/messages?access_token=${config('PAGE_ACCESS_TOKEN')}`
            ,{payload:payload}
        )
    } 
}

module.exports = _export; 




 
