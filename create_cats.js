const prompt = require('prompt');
const fs = require('fs');

let  merchants = undefined;


let cats = [];
let results = [];

let iteration = (index) => {

    let merchant = merchants[index];
    console.log('Merchant Name Is:' + merchant);
    console.log('Categories are:' + JSON.stringify(cats));
    prompt.get(['category'], (err,res) => {
        if (err) console.error(err); 
        else {
            if (!cats.find(it=> it == res.category)) cats.push(res.category);
            let newObj =  {name: merchant, real_name: res.real_name, category: res.category};
            console.log(newObj);
            results.push(newObj);
            if (index < merchants.length) {
              iteration(index+1);
            }
            else {
                fs.writeFile('./merchants_res.json',results,(err) => console.error)
            }
        }
    })
} 


fs.readFile('./merchants.json', (err,data) => {
    merchants = data.toString().split(",");   
    let ind = 0;
    prompt.start();
    iteration(0); 
})









