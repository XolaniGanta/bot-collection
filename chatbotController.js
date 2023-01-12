'use strict';

const router = require('express').Router();
const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');
const {Sequelize, DataTypes} = require("sequelize");
const { WebClient } = require('@slack/web-api');
const {emoji} = require('node-emoji');

const slackToken = process.env.SLACK_BOT_TOKEN;
const slack = new WebClient(slackToken);

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

//listening to events 
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
              let filterID = incomingTextMessage.match(/^[a-zA-Z]+$/); //if its only letters
              if (filterID !== null) {
                Whatsapp.sendSimpleButtons({
                  message: `Hey ${recipientName}\n\nWelcome To BestforU Self-Service - the safe, easy way to pay and check balance on your account.\n\nLets get started...\n\nChoose any option below\n\nShortcut: If you need help reply with # to chat with an agent`,
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
          if (typeOfMsg === 'text_message') {
            let incomingTextMessage = incomingMessage.text.body;
            let filterAgent = incomingTextMessage;
             if(filterAgent === '#'){
              await Whatsapp.sendSimpleButtons({
                message: `Click the below button an agent will be in contact with you in few minutes `,
                recipientPhone: recipientPhone,
                listOfButtons:[{
                  title: 'Live Agent',
                  id: 'live_agent'
                }]
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

          } 
    if (typeOfMsg === 'text_message') {
            let incomingTextMessage = incomingMessage.text.body;
            let filterID = incomingTextMessage.match(/^\d+$/); //detect numbers
            let count = incomingTextMessage.length;
           if (filterID !== null  && count === 13) {
            const users = await clientinfo.findAll({
              where: {
                idnumber: filterID
              },
              limit: 5
            });

        if (users && users.length > 0) {
            const userData = users.map(clientinfo => `Name:${clientinfo.name} ${clientinfo.surname}\nCurrent balance is:R${clientinfo.nettsalary}`);
              await Whatsapp.sendSimpleButtons({
                message: (`${userData}`),
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
            } else {
              await Whatsapp.sendText({
                message: 'Sorry, we could not find a user with that ID number in our database.',
                recipientPhone: recipientPhone
              });
            }
            
        } else if(filterID !== null && count !== 13) {
          await Whatsapp.sendText({
            message:'It seems you have entered a wrong id number, Please check and re-enter your id number',
            recipientPhone: recipientPhone
          });
        } 
            }
              
      if(typeOfMsg === 'simple_button_message'){
        let buttonID = incomingMessage.button_reply.id;
        if (buttonID === 'continue_btn'){
            await Whatsapp.sendText({
              message: `Please note you will be redirected outside WhatsApp to make your secure payments.\n\nPlease follow this URL to make your payment now: https://ab8c-102-134-121-96.in.ngrok.io/trustlink_integration/checkout.php`,
              recipientPhone: recipientPhone,
            })
        }
    }                 
    if(typeOfMsg === 'simple_button_message'){
      let buttonID = incomingMessage.button_reply.id;
      if (buttonID === 'pay_account'){
          await Whatsapp.sendText({
            message: `Please note you will be redirected outside WhatsApp to make your secure payments.\n\nPlease follow this URL: https://ab8c-102-134-121-96.in.ngrok.io/trustlink_integration/checkout.php`,
            recipientPhone: recipientPhone,
          })
      }
  } 
  if(typeOfMsg === 'simple_button_message'){
    let buttonID = incomingMessage.button_reply.id;
    if (buttonID === 'pay_account'){
        await Whatsapp.sendText({
          message: `Please note you will be redirected outside WhatsApp to make your secure payments.\n\nPlease follow this URL: https://ab8c-102-134-121-96.in.ngrok.io/trustlink_integration/checkout.php`,
          recipientPhone: recipientPhone,
        })
    }
} 
 if(typeOfMsg === 'simple_button_message'){
  let buttonID = incomingMessage.button_reply.id;
  if (buttonID === 'live_agent'){
     await slack.chat.postMessage({
      channel: '#general',
      text: `A user has requested a transfer to a live agent. User number: ${recipientPhone}.`,
      attachments: [
        {
          text: "Ticket status",
          callback_id: "transfer_agent",
           actions: [
            {
              name: "transfer",
              type: "button",
              text: "Solve me",
              value: "transfer"
            }
          ]
        
     }]
  });
  }
} 
  if(typeOfMsg === 'simple_button_message'){
    let buttonID = incomingMessage.button_reply.id;
    if (buttonID === 'Done_btn'){
        await Whatsapp.sendText({
          message: `Thank you for contacting BestForU.\n\nPlease make sure you have settle your account.\n\nCheers have a good day`,
          recipientPhone: recipientPhone,
        })
    }
} 
await Whatsapp.markMessageAsRead({
      message_id,
});
 }                      
    return res.sendStatus(200);
} catch (error) {
    console.error({ error })
    return res.sendStatus(500);
}
});

module.exports = router;

