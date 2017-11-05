const Wreck = require('wreck');


const BUDGET = {};
const API_URL = 'https://3hkaob4gkc.execute-api.us-east-1.amazonaws.com/prod/au-hackathon/';

let _export = {
  getBudget  :  (customerId) => {
    return BUDGET[customerId];
  }   
 ,setBudget : (customerId, amount) => {
    BUDGET[customerId] = amount;
  }  
  //expects month to be in mm format
  ,listTransactionsMonth: (customerId, month) => {
    return Wreck.post(API_URL+'transactions/', 
      {payload: {
                     "date_from": month + "/01/2017"
                     ,"date_to": month+1+"/01/2017" 
                     ,"customer_id": customerId
                }
      }
     ).then(res => res.customers.transactions.reduce((curr, prev) => prev + curr, 0)) 
  }
}  


module.exports = _export;  


