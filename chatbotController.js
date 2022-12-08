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
        identity_number: DataTypes.TEXT
    },
    {
      
        createdAt: false,
        updatedAt: false,
        freezeTableName: true,
        name:DataTypes.TEXT,
        surname:DataTypes.TEXT
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
        
          if (filterID !== null) {
            const reuse = await user.findAll({
                where:{
                  identity_number: filterID
                },
                limit:5
              })
                  if (reuse) {
                   
                      await Whatsapp.sendText({
                          message: (`${reuse} dsgasbhvx`),
                          recipientPhone: recipientPhone
                      });

                      console.log(reuse)
                  }
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

