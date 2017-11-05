const Wreck = require('wreck');
const LuCategory = require('./cat_lookup');
const _ = require('lodash')
const Moment = require('moment');

const BUDGET = { };
const facebookToCapitalId  = (id) => {
  let map = {
    1484444364926018:401930000
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

  /**
   *  doesn't work
   */
  listRewards = (fbid, month) => {
    let customerId = facebookToCapitalId(sender_id);
    return Wreck.post(API_URL+'customers/',
    {payload: {
      "customer_id": customerId
      ,"team_name": "ed_and_roland"
    }}).then(res => {
      let resArray = JSON.parse(res.payload.toString())[0];
      let accountId = resArray.customers[0].account_id;
      return Wreck.post(API_URL + 'rewards/', {payload: {
        "account_id": accountId  
        ,"date_from": month + "/01/2017"
        ,"date_to": (month+1)+"/01/2017"
      }})  
    })
  }  

  getMyself  = (sender_id) => {
    let customerId = facebookToCapitalId(sender_id);
    return Wreck.post(API_URL+'customers/',
    {payload: {
      "customer_id": customerId
      ,"team_name": "ed_and_roland"
    }}).then(res => {
      let resArray = JSON.parse(res.payload.toString())[0];
      let allowance = BUDGET[customerId] || 'Allowance not set';  
      return { title: 'yourself', subtitle: allowance, id: resArray.customers[0].customer_id  } ;
    })
  }

  getUnrestrictedMembers = (sender_id) => {
    return listFamilyMembers(sender_id).then(res => {
      return res.filter(it => it.subtitle.includes('not set')) 
    })
  }

  getIdByName = (sender_id, name) => {
    return listFamilyMembers(sender_id).then(family => {
      let person = family.find(it => it.title.includes(name))
      if (person) return  person.id 
      else return Promise.resolve(undefined);
    }).then(id => {
      month = Moment().month(); 
      return listTransactionsMonth(id,month).then(done =>{
        return id;
      })
    })
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
        let name = resArray.customers[0].first_name;
        let id = resArray.customers[0].customer_id; 
        let allowance = (BUDGET[id])? ('$'+BUDGET[id]) : 'Allowance not set';  
        return { title: name, subtitle: allowance, id: resArray.customers[0].customer_id  } ;
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
  listTransactionsMonth= (customerId, month) => {
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
    if (!budget) {
      return Promise.resolve({
        answer: false  
      }) 
    } 
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
  setAllowanceLimit = (custId, limit) => {
    BUDGET[custId] = limit
    return Promise.resolve(); 
  }




  listTransactionsByCategory = (customerId, month) => {

    if (state['transactions']) {
      let stuff = state.transactions.reduce((acc,curr) => {
        let merchant_name = curr['merchant_name']
        let category =  LuCategory.find(it => it['merch_name'].trim().toUpperCase() == merchant_name.toUpperCase());
        if (category) {
          let name  = acc[category.cat_name];
          if (name) {
            acc[category.cat_name]  = round(parseFloat(name)+ curr.amount);
          }
          else {
            acc[category.cat_name] = round(curr.amount);
          }
        }
        return acc;
      },{})
      let inverted = _.invert(stuff);
      let top4 = Object.values(stuff).sort().slice(0,4).map(val => { let key =inverted[val]; let retv ={}; retv['title']=key; retv['subtitle']=val; return retv; }); 
      return Promise.resolve(top4); 
    }
    else {
      return Promise.resolve();
    }
  }

round = (num) =>Math.round((num * 100) / 100).toFixed(2); 


module.exports ={
  listTransactionsByCategory:listTransactionsByCategory
  ,listTransactionsMonth:listTransactionsMonth
  ,listFamilyMembers:listFamilyMembers
  ,listRewards: listRewards
  ,setBudgetLimit:setBudgetLimit
  ,setAllowanceLimit: setAllowanceLimit
  ,checkWithinBudget:checkWithinBudget
  ,getUnrestrictedMembers: getUnrestrictedMembers
  ,getMyself: getMyself
  ,getIdByName: getIdByName
  ,facebookToCapitalId:facebookToCapitalId
};
