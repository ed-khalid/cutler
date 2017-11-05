const Wreck = require('wreck');
const LuCategory = require('./LuCategory');


const BUDGET = {};
const CAPITAL_ID = 401930000;
const facebookToCapitalId  = (id) => {
  let map = {
     1732853743453321:401930000
    ,142169726418680:401930000
  }

  return map[id] || 401950000
}

let state = {
  transactions: undefined
}


const API_URL = 'https://3hkaob4gkc.execute-api.us-east-1.amazonaws.com/prod/au-hackathon/';

  getBudget  =  (fbid) => {
    return BUDGET[facebookToCapitalId(fbid)];
  }
 setBudget = (fbid, amount) => {
    let customerId = facebookToCapitalId(fbid);
    if (!customerId) return null;
    BUDGET[customerId] = amount;
  }

  listFamilyMembers=(fbid) => {
    let customerId = facebookToCapitalId(fbid);
    if (!customerId) return Promise.resolve(null);
    return Wreck.post(API_URL+'customers/',
    {payload: {
      "customer_id": customerId
      ,"team_name": "ed_and_roland"
    }
    }).then(function(res) {
      let resArray = JSON.parse(res.payload.toString())[0];
      let accountId = resArray.account_id
      return Wreck.post(API_URL+'accounts/', {
        payload:{
          "account_id" : accountId
        }
      }).then(function(res) {
      let resArray = JSON.parse(res.payload.toString())[0];
      let familyIds =  resArray.authorized_users.map(it => it.customer_id)
      let promises =  familyIds.map(id => Wreck.post(API_URL+'customers', {payload: {"customer_id":id} }).then(function(res) {
        let resArray = JSON.parse(res.payload.toString())[0];
        let name = resArray.customers[0].first_name
        return name;
      }))
      return Promise.all(promises)
      })
      .catch(err => {
        console.error(err)
        return Promise.resolve('I must have had too much Soylent. Indigestion');
      })
    })
  }

  //expects month to be in mm format
  listTransactionsMonth= (fbid, month) => {
    let customerId = facebookToCapitalId(fbid);
    if (!customerId) return Promise.resolve(null);
    return Wreck.post(API_URL+'transactions/',
      {payload: {
                     "date_from": month + "/01/2017"
                     ,"date_to": (month+1)+"/01/2017"
                     ,"customer_id": customerId
                }
      }
     ).then(function(res)  {
       let resArray = JSON.parse(res.payload.toString())[0]
        state['transactions'] = resArray.customers[0].transactions;
       let sum =  state['transactions'].reduce((prev, curr) => prev + curr.amount, 0)
       return Math.round((sum * 100) / 100).toFixed(2);
    })
  }
  checkWithinBudget=(fbid,month) => {
    let budget = getBudget(fbid);
    return listTransactionsMonth(fbid,month).then(sum => {
      let answer = (budget >= sum);
      return  {
        answer: answer
        ,budget: budget
        ,sum : sum
      }
    })
  }

  setBudgetLimit=(fbid,limit) => {
    setBudget(fbid, limit)
    return Promise.resolve();
  }


  listTransactionsByCategory = (fbid, month) => {

    if (state['transactions']) {
      state.transactions.reduce((acc,curr) => {
        let merchant_name = curr['merchant_name']
        let category =  LuCategory.find(it => it['merch_name'].toUpperCase() == merchant_name.toUpperCase());
        if (category) {
          let name  = acc[category.cat_name];
          if (name) {
            acc[name]  += curr.amount;
          }
          else {
            acc[category.cat_name] = curr.amount
          }
        }
        return acc;
      },{})
      return acc;
    }
    else {
      return Promise.resolve();
    }
  }

module.exports ={
  listTransactionsByCategory:listTransactionsByCategory
  ,listTransactionsMonth:listTransactionsMonth
  ,listFamilyMembers:listFamilyMembers
  ,setBudgetLimit:setBudgetLimit
  ,checkWithinBudget:checkWithinBudget
};
