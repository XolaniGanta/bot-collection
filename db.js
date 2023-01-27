const dotenv = require('dotenv');
const {Sequelize, DataTypes} = require("sequelize");
dotenv.config();

console.log('starting...')
//Database variables
/*
const dbName = process.env.DB_NAME;  
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbURL = process.env.DB_HOST;
*/
const dbName = process.env.DbName; 
const Db = process.env.DbName1; 
const dbUsername = process.env.DbUsername; 
const dbPassword = process.env.DbPassword;
const dbURL = process.env.DbHost;


//create database1 connection
const sequelize = new Sequelize(
  dbName,
  dbUsername,
  dbPassword,
   {
     host: dbURL,
     dialect: 'mysql'
   }
 );
sequelize.authenticate()
 .then(() => {
   console.log('Connection to database has been established successfully.');
 })
 .catch(err => {
   console.error('Unable to connect to the database:', err);
 });
 //create database1 connection
const sequelize1 = new Sequelize(
  Db,
  dbUsername,
  dbPassword,
   {
     host: dbURL,
     dialect: 'mysql'
   }
 );
sequelize1.authenticate()
 .then(() => {
   console.log('Connection to database! has been established successfully.');
 })
 .catch(err => {
   console.error('Unable to connect to the database:', err);
 });
 const transaction = sequelize1.define(
  "transaction",{
    idnumber:{ 
      type: DataTypes.INTEGER
  },
    amountPayed: DataTypes.DECIMAL,
    time:DataTypes.TIME
},
{
  createdAt: false,
  updatedAt: false,
  freezeTableName: true,
  timestamps: false
}
 );
 transaction.removeAttribute('id');

//client details databases instance
const bot_view = sequelize.define(
    "bot_view",{
        idnumber:{ 
          type: DataTypes.INTEGER
        },
        name:DataTypes.TEXT,
        settlement_value:DataTypes.INTEGER,
        full_contract_value:DataTypes.DECIMAL,
        installment_value:DataTypes.DECIMAL
    },
    {
        createdAt: false,
        updatedAt: false,
        freezeTableName: true,
        timestamps: false
    }
  );
  bot_view.removeAttribute('id');
  sequelize1.query(
    "SELECT amountPayed FROM transaction WHERE idnumber = '404' ORDER BY time DESC LIMIT 1",{ type: sequelize.QueryTypes.SELECT})
    .then(result => {
      sequelize.query("SELECT * FROM bot_view WHERE idnumber = '404' LIMIT 5", { type: sequelize.QueryTypes.SELECT})
        .then(users => {
          if (users && users.length > 0) {
            users.forEach(user => {
               const updatedBalance = user.settlement_value - result[0].amountPayed;
               console.log(`Name: ${user.name}\nFull Contract: ${user.settlement_value}\nCurrent balance: R${updatedBalance}\nDue:${user.installment_value}`);
            });
          }
        })
       .catch(err => {
         console.error('Unable to fetch data from the view:', err);
       });
    });
    //