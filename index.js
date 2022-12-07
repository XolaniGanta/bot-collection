const dotenv = require('dotenv');
const express = require('express');
dotenv.config();

//changed conf
let chatbotRoute=require('./chatbotController.js');

const main = async () => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use('/', chatbotRoute);
    app.use('*', (req, res) => res.status(404).send('404 Not Found'));
    app.listen(process.env.PORT,()=>{
        console.log("Establishing connection...");
    });
}
//console.log(process.env.PORT);
main();
