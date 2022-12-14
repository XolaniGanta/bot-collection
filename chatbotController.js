'use strict';

const router = require('express').Router();
const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');
const {Sequelize, DataTypes} = require("sequelize");
const { isValid } = require('./validation/IdValidation');

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
        
    
           if (typeOfMsg === 'text_message') {
              let incomingTextMessage = incomingMessage.text.body;
              let filterID = incomingTextMessage.match(/^\d+$/); //if it has numbers 
              if (filterID === null) {
                Whatsapp.sendSimpleButtons({
                  message: `Hey ${recipientName} Welcome to BestforU Self Service. Click the continue button to continue`,
                  recipientPhone: recipientPhone,
                  listOfButtons: [{
                      title: 'Continue',
                      id: 'pay_account'
                  }]
                });
              }
          }
         
     if (typeOfMsg === 'simple_button_message') {
            let buttonID = incomingMessage.button_reply.id;
            if (buttonID === 'pay_account') {
              await Whatsapp.sendText({
                message: `For security reasons please enter your id number.  `,
                recipientPhone: recipientPhone
              });
            }
           
          } else if (typeOfMsg === 'text_message') {
            let incomingTextMessage = incomingMessage.text.body;
            let filterID = incomingTextMessage.match(/^\d+$/); //if it has numbers
            if (isValid(filterID) !== null) {
              // Find all users with the specified identity number
              const users = await clientinfo.findAll({
                where: {
                  idnumber: filterID
                },
                limit: 5
              });
          
              if (users && users.length > 0) {
                // Map the users to their names and balances
                const forma = users.map(clientinfo => `Please Confirm if these details are correct: \nName:${clientinfo.name} \nSurname:${clientinfo.surname} \nID Number:${clientinfo.idnumber} \nCell No:${clientinfo.cellno} \nBalance:${clientinfo.nettsalary}`);
          
                // Send the message to the recipient
                await Whatsapp.sendSimpleButtons({
                  message: (`${forma}`),
                  recipientPhone: recipientPhone,
                  listOfButtons: [{
                    title: 'It is correct',
                    id: 'correct_btn'
                  },
                  {
                    title: 'No,update',
                    id: 'update_btn'
                  }]
                });
                
              } 
            }
          }
      if(typeOfMsg === 'simple_button_message'){
        let buttonID = incomingMessage.button_reply.id;
        if (buttonID === 'correct_btn'){
            await Whatsapp.sendSimpleButtons({
              message: `If you wish to recieve an invoice please enter your email`,
              recipientPhone: recipientPhone,
              listOfButtons: [{
                title: 'Skip for Now',
                id: 'skip_btn'
              }]
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

