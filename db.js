
const dotenv = require('dotenv');
const {Sequelize, DataTypes} = require("sequelize");
dotenv.config();
const prompt = require("prompt-sync")({ sigint: true });
 
const dbName = process.env.DbName; 
const Db = process.env.DbName1; 
const dbUsername = process.env.DbUsername; 
const dbPassword = process.env.DbPassword;
const dbURL = process.env.DbHost;

const idsNumber = prompt("enter your id number:");
//db connection for database2 
/******************************/
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
    id:{ 
      type: DataTypes.INTEGER,
      primaryKey:true
  },
    idnumber:DataTypes.INTEGER,
    amountPayed: DataTypes.DECIMAL,
    time:DataTypes.TIME,
    status:DataTypes.BOOLEAN
},

{
  createdAt: false,
  updatedAt: false,
  freezeTableName: true,
  timestamps: false
}
 );
// transaction.removeAttribute('id');

/******************************/
const queries = sequelize1.define(
  "queries",{
    id:{ 
      type: DataTypes.INTEGER,
      primaryKey:true
  },
    ids:DataTypes.INTEGER,
    latest_balance: DataTypes.DECIMAL
},

{
  createdAt: false,
  updatedAt: false,
  freezeTableName: true,
  timestamps: false
}
 );

/******************************/

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

//*******************************/
async function updateOutstandingBalance() {
    let outstandingBalance = null;
    const payment = await transaction.findOne({
      where: {
        idnumber: idsNumber,
        status:true
      },
      order: [['time', 'DESC']]
    });
    if (payment) {
      console.log(`Amount paid: R${payment.amountPayed}`);
      const record = await queries.findOne({
        where: {
          ids: payment.id
        }
      });
      if (!record) {
        await queries.create({
          ids: payment.id
        });
        console.log("save...")
        if (outstandingBalance === null || outstandingBalance !== payment.amountPayed) {
          await bot_view.update({
            full_contract_value: sequelize.literal(`full_contract_value - ${payment.amountPayed}`)
          }, {
            where: {
              idnumber: idsNumber
            }
          });
          console.log('Outstanding balance updated!' + payment.id);
          outstandingBalance = payment.amountPayed;
        }
      } else {
        console.log('Id already exists in the database');
      }
    }
    const users = await bot_view.findAll({
      where: {
        idnumber: idsNumber
      },
      limit: 5
    });
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`Name: ${user.name}\nFull Contract: R${user.settlement_value}\nCurrent balance: R${user.full_contract_value}\nDue:R${user.installment_value}`);
      });
    }
  }                           
  updateOutstandingBalance();

/*
if (users && users.length > 0) {
  const userData = users.map(bot_view => `Name:${bot_view.name} ${bot_view.full_contract_value}\nCurrent balance is:R${bot_view.settlement_value}`);
 
}

 /*
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
    */