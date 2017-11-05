const Wreck = require('wreck');


const BUDGET = {};
const CAPITAL_ID = 401930000;
const facebookToCapitalId  = {
  1732853743453321:401930000 
 ,142169726418680:401930000 
} 
const API_URL = 'https://3hkaob4gkc.execute-api.us-east-1.amazonaws.com/prod/au-hackathon/';

let _export = {
  getBudget  :  (customerId) => {
    return BUDGET[customerId];
  }   
 ,setBudget : (fbid, amount) => {
    let customerId = CAPITAL_ID;  
    if (!customerId) return null; 
    BUDGET[customerId] = amount;
  }  
  //expects month to be in mm format
  ,listTransactionsMonth: (fbid, month) => {
    let customerId = CAPITAL_ID; 
    if (!customerId) return null; 
    return Wreck.post(API_URL+'transactions/', 
      {payload: {
                     "date_from": month + "/01/2017"
                     ,"date_to": (month+1)+"/01/2017" 
                     ,"customer_id": customerId
                }
      }
     ).then(function(res)  {  
       let resArray = JSON.parse(res.payload.toString())[0]  
       let sum =  resArray.customers[0].transactions.reduce((prev, curr) => prev + curr.amount, 0)
       return Math.round((sum * 100) / 100).toFixed(2);
    }) 
  }
}  


module.exports = _export;  


