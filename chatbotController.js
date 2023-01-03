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

  //check our application
  router.get("/", (req, res) => {
    res.status(200).send("Webhook working...");
});
//Database variables
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

    const clientinfo = sequelize.define(
        "clientinfo",{
            idnumber:{ 
              type: DataTypes.TEXT,
              primaryKey: true
            },
            name:DataTypes.TEXT,
            surname:DataTypes.TEXT,
            Email:DataTypes.TEXT,
            nettsalary:DataTypes.TEXT,
            cellno:DataTypes.TEXT
            
        },
        {
            createdAt: false,
            updatedAt: false,
            freezeTableName: true
        }
        
      );
//Verifying the token 
router.get('/webhook', (req, res) => {
    try {
        console.log('Getting a request!');
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
        
    
           if (typeOfMsg === 'text_message') {
              let incomingTextMessage = incomingMessage.text.body;
              let filterID = incomingTextMessage.match(/^\d+$/); //if it has numbers 
              if (filterID === null) {
                Whatsapp.sendSimpleButtons({
                  message: `Hey ${recipientName} Welcome to BestforU Self-Service - the safe,easy way to pay and check balance on your account.\n Lets get started...\n Choose an option below `,
                  recipientPhone: recipientPhone,
                  listOfButtons: [{
                      title: 'Pay my Account',
                      id: 'pay_account'
                  },{
                      title: 'Check Balance',
                      id: 'check_balance'
                  }
                ]
                });
              }
          }
         
     if (typeOfMsg === 'simple_button_message') {
            let buttonID = incomingMessage.button_reply.id;
            if (buttonID === 'check_balance') {
              await Whatsapp.sendText({
                message: `For security reasons please enter your id number.  `,
                recipientPhone: recipientPhone
              });
            }
           
          } else if (typeOfMsg === 'text_message') {
            let incomingTextMessage = incomingMessage.text.body;
            let filterID = incomingTextMessage.match(/^\d+$/); //detect numbers
            let count = incomingTextMessage.length;
          //let dob = incomingTextMessage.substring(0,6);
          //  && count === 13 && isValidDate(dob)
           if (filterID === null  && count === 13) {
            // Find all users with the specified identity number
            const users = await clientinfo.findAll({
              where: {
                idnumber: filterID
              },
              limit: 5
            });
            if (users && users.length > 0) {
             // Map the users to their names and balances
              const forma = users.map(clientinfo => `${clientinfo.name} ${clientinfo.surname} your current balance is: \nBalance:${clientinfo.nettsalary}`);

              await Whatsapp.sendSimpleButtons({
                message: (`${forma}`),
                recipientPhone: recipientPhone,
                listOfButtons: [{
                  title: 'Continue Pay account',
                  id: 'continue_btn'
                },
                {
                  title: 'Done',
                  id: 'Done_btn'
                }]
              });
            
            } 
           
        }
            } 
              
      if(typeOfMsg === 'simple_button_message'){
        let buttonID = incomingMessage.button_reply.id;
        if (buttonID === 'continue_btn' || 'pay_account'){
            await Whatsapp.sendText({
              message: `Please note you will be redirected outside WhatsApp to perfom your transcation.\n Please follow this URL: https://0e0c-102-134-121-96.in.ngrok.io/trustlink_integration/checkout.php`,
              recipientPhone: recipientPhone,
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

