'use strict';

const router = require('express').Router();
const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');
const {Sequelize, DataTypes} = require("sequelize");

const Whatsapp = new WhatsappCloudAPI({
    accessToken: process.env.Meta_WA_accessToken,
    senderPhoneNumberId: process.env.Meta_WA_SenderPhoneNumberId,
    WABA_ID: process.env.Meta_WA_wabaId,
    graphAPIVersion: 'v15.0'
});

const dbName = process.env.DB_NAME;
const dbUsername = process.env.DB_USERNAME
const dbPassword = process.env.DB_PASSWORD
const dbURL = process.env.DB_HOST

//create database connection
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
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

  const user = sequelize.define(
    "user",{
        identity_number: DataTypes.TEXT,
        name:DataTypes.TEXT,
        surname:DataTypes.TEXT,
        email:DataTypes.TEXT,
        balance:DataTypes.DECIMAL
    },
    {
      
        createdAt: false,
        updatedAt: false,
        freezeTableName: true
        
    }
    
  );

  

  //check our application
  router.get("/", (req, res) => {
    res.status(200).send("Webhook working...");
});

//Verifying the token 
router.get('/webhook', (req, res) => {
    try {
        console.log('Doing a get request!');
        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];

        if (
            mode &&
            token &&
            mode === 'subscribe' &&
            process.env.Meta_WA_VerifyToken === token
        ) {
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    } catch (error) {
        console.error({ error })
        return res.sendStatus(500);
    }
});

router.post('/webhook', async (req, res) => {

    try{
        let data = Whatsapp.parseMessage(req.body);
        console.log(JSON.stringify(data, null, 2));

        if (data?.isMessage) {
            let incomingMessage = data.message;
            let recipientPhone = incomingMessage.from.phone; // extract the phone number of sender
            let recipientName = incomingMessage.from.name;
            let typeOfMsg = incomingMessage.type; // extract the type of message (some are text, others are images, others are responses to buttons etc...)
            let message_id = incomingMessage.message_id; // extract the message id

      async  function check_balance(filterID){
          const users = await user.findAll({
            where: {
              identity_number: filterID
            },
            limit: 5
          });
      
          if (users && users.length > 0) {
            // Map the users to their names and balances
            const forma = users.map(user => `Hello ${user.name} your current balance is R: ${user.balance}`);
      
            // Send the message to the recipient
            await Whatsapp.sendSimpleButtons({
              message: (`${forma}`),
              recipientPhone: recipientPhone,
              listOfButtons: [{
                title: 'Settle your account',
                id: 'settle_account'
              },
              {
                title: 'Done',
                id: 'Done_btn'
              }]
            });
          } 
        }
            


           if (typeOfMsg === 'text_message') {
              let incomingTextMessage = incomingMessage.text.body;
              let filterID = incomingTextMessage.match(/^\d+$/); //if it has numbers 
              if (filterID === null) {
                Whatsapp.sendSimpleButtons({
                  message: `Hi ${recipientName} Welcome to BestforU Self Service. Choose what operation do you want to perform`,
                  recipientPhone: recipientPhone,
                  listOfButtons: [{
                      title: 'Pay your account',
                      id: 'pay_account'
                  },
                  {
                      title: 'Check balance',
                      id: 'check_balance'
                  }]
                });
              }
          }
         
     if (typeOfMsg === 'simple_button_message') {
            let buttonID = incomingMessage.button_reply.id;
            if (buttonID === 'check_balance') {
              await Whatsapp.sendText({
                message: `For security reasons you required to enter your id number.  `,
                recipientPhone: recipientPhone
              });
            }
          } else if (typeOfMsg === 'text_message') {
            let incomingTextMessage = incomingMessage.text.body;
            let filterID = incomingTextMessage.match(/^\d+$/); //if it has numbers
            if (filterID !== null) {
              // Find all users with the specified identity number
              check_balance(filterID)
            }
          } 
        
        
      if(typeOfMsg === 'simple_button_message'){
        let buttonID = incomingMessage.button_reply.id;
        if (buttonID === 'Done_btn'){
            await Whatsapp.sendText({
              message: `Have a great day!`,
              recipientPhone: recipientPhone
            })
        }
    }
          
    }
    return res.sendStatus(200);
} catch (error) {
    console.error({ error })
    return res.sendStatus(500);
}
});

module.exports = router;

