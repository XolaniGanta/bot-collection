'use strict';

const router = require('express').Router();
const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');
const {Sequelize, DataTypes} = require("sequelize");
const { WebClient } = require('@slack/web-api');
const emoji = require('node-emoji');
const bolds = require('node-strings');

const slackToken = process.env.SLACK_BOT_TOKEN;
const slack = new WebClient(slackToken);

const Whatsapp = new WhatsappCloudAPI({
    accessToken: process.env.Meta_WA_accessToken,
    senderPhoneNumberId: process.env.Meta_WA_SenderPhoneNumberId,
    WABA_ID: process.env.Meta_WA_wabaId,
    graphAPIVersion: 'v15.0'
});
  router.get("/", (req, res) => {
    res.status(200).send("Webhook working...");
});

const dbName = process.env.DB_NAME;  
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbURL = process.env.DB_HOST;

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
       console.log("**Connection to database has been established successfully.**");
     })
     .catch(err => {
       console.error('Unable to connect to the database:', err);
     });
    const bot_views = sequelize.define(
        "bot_views",{
            idnumber:{ 
              type: DataTypes.TEXT
            },
            name:DataTypes.TEXT,
            surname:DataTypes.TEXT,
            settlement_value:DataTypes.DECIMAL,
            full_contract_value:DataTypes.DECIMAL,
            installment_value:DataTypes.DECIMAL
        },
        {
            createdAt: false,
            updatedAt: false,
            freezeTableName: true
        }
      );

bot_views.removeAttribute('id');

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

router.post('/webhook', async (req, res) => {
    try{
        let data = Whatsapp.parseMessage(req.body);
        console.log(JSON.stringify(data, null, 2));

        if (data?.isMessage) {
            let incomingMessage = data.message;
            let recipientPhone = incomingMessage.from.phone; 
           // let recipientName = incomingMessage.from.name
            let typeOfMsg = incomingMessage.type; 
            let message_id = incomingMessage.message_id; 
      
           if (typeOfMsg === 'text_message') {
              let incomingTextMessage = incomingMessage.text.body;
              let filterID = incomingTextMessage.match(/^[a-zA-Z]+$/); 
              if (filterID !== null) {
                Whatsapp.sendSimpleButtons({
                  message: `*Hi `+emoji.get(':wave:')+ ` Welcome to Bestie ` +emoji.get(':robot_face:')+ ` the bot.* \n\nPowered by Bestforu - the safe, easy way to pay and check balance on your account.\n\n*Click the below button to get started*\n\n*`+emoji.get(':bulb:')+`If you need help reply with # to chat with an agent.*`,
                  recipientPhone: recipientPhone,
                  listOfButtons: [{
                      title: 'Get Started',
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
                message: `Click the button below and an agent will be in contact with you shortly.`,
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
                message: `*`+emoji.get(':exclamation:')+`In order to continue you are required to enter your id number.*`,
                recipientPhone: recipientPhone
              });
            }
          } 
    if (typeOfMsg === 'text_message') {
            let incomingTextMessage = incomingMessage.text.body;
            let filterID = incomingTextMessage.match(/^\d+$/); 
            let count = incomingTextMessage.length;
           if (filterID !== null  && count === 13) {
            const users = await bot_views.findAll({
              where: {
                idnumber: filterID
              },
              limit: 1
            });
         if (users && users.length > 0) {
            const userData = users.map(bot_views => `Name: ${bot_views.name} ${bot_views.surname}\nFull Contract: R${bot_views.full_contract_value}\nBalance: R${bot_views.settlement_value}\nDue: R${bot_views.installment_value}`);//closed_lock_with_key
              await Whatsapp.sendSimpleButtons({
                message: (`*Please find information regarding your account below:*\n\n${userData}\n\n*To continue making your payment, click the button below.*\n\n*`+emoji.get(':exclamation:')+`Please note that updates to the balance will be reflected after 24 hours.*`),
                recipientPhone: recipientPhone,
                listOfButtons: [{
                  title: 'Continue Pay account',
                  id: 'continue_btn'
                },
                {
                  title: 'Cancel',
                  id: 'Done_btn'
                }]
              });
            } else {
              await Whatsapp.sendText({
                message:`*`+emoji.get(':pensive:')+ `We apologize, but the specified ID number was not located in our records. Please verify the accuracy of the ID number and re-enter it to proceed.*`,
                recipientPhone: recipientPhone
              });
            }
        } else if(filterID !== null && count !== 13) {
          await Whatsapp.sendText({
            message:emoji.get(':grimacing:')+'Oops! it seems you have entered a wrong id number, Please check and re-enter your id number',
            recipientPhone: recipientPhone
          });
        } 
            }
      if(typeOfMsg === 'simple_button_message'){
        let buttonID = incomingMessage.button_reply.id;
        if (buttonID === 'continue_btn'){
            await Whatsapp.sendText({
              message: `*`+emoji.get(':exclamation:')+ `Please note you will be redirected outside WhatsApp to make your secure payments.*\n\nPlease follow this link to make your payment now ` +emoji.get(':point_right:')+`: http://apspay.biz/ \n\n*` +emoji.get(':closed_lock_with_key:')+ `Rest assured that your personal information is protected with advanced security measures.*`,
              recipientPhone: recipientPhone,
            })
        }
    }                 
    if (typeOfMsg === 'simple_button_message') {
      let buttonID = incomingMessage.button_reply.id;
      const recipients = ['C04JDHFEJCA', 'C04JG1K9M5J'];
      let recipientIndex = 0;
      if (buttonID === 'live_agent') {
        recipientIndex = (recipientIndex + 1) % 2;
      const recipient = recipients[recipientIndex];
        console.log(`recipientIndex: ${recipientIndex}, recipient: ${recipient}`);
         await slack.chat.postMessage({
          channel: recipient,
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
            }
          ]
        });
      }
    }
  if(typeOfMsg === 'simple_button_message'){
    let buttonID = incomingMessage.button_reply.id;
    if (buttonID === 'Done_btn'){
        await Whatsapp.sendText({
          message: `Sad to see you going.\n\n*Please make sure you have settle your account.*\n\nCheers have a good day`+emoji.get(':wave:'),
          recipientPhone: recipientPhone,
        })
    }
} 
if(typeOfMsg === 'simple_button_message'){
  let buttonID = incomingMessage.button_reply.id;
  if (buttonID === 'live_agent'){
      await Whatsapp.sendText({
        message: `*Connecting to an agent...*`,
        recipientPhone: recipientPhone,
      })
  }
} await Whatsapp.markMessageAsRead({
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


