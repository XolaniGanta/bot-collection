// const {Sequelize, DataTypes} = require("sequelize");

// //Database variables
// const dbName = process.env.DB_NAME;
// const dbUsername = process.env.DB_USERNAME
// const dbPassword = process.env.DB_PASSWORD
// const dbURL = process.env.DB_HOST

// //create database connection
//   const sequelize = new Sequelize(
//       dbName,
//       dbUsername,
//       dbPassword,
//        {
//          host: dbURL,
//          dialect: 'mysql'
//        }
//      );

//   sequelize.authenticate()
//      .then(() => {
//        console.log('Connection has been established successfully.');
//      })
//      .catch(err => {
//        console.error('Unable to connect to the database:', err);
//      });

//     const clientinfo = sequelize.define(
//         "clientinfo",{
//             idnumber:{ 
//               type: DataTypes.TEXT,
//               primaryKey: true
//             },
//             name:DataTypes.TEXT,
//             surname:DataTypes.TEXT,
//             Email:DataTypes.TEXT,
//             nettsalary:DataTypes.TEXT,
//             cellno:DataTypes.TEXT
            
//         },
//         {
//             createdAt: false,
//             updatedAt: false,
//             freezeTableName: true
//         }
        
//       );
//  async function getUserInfo(filterID) {
//     const users = await clientinfo.findAll({
//       where: {
//         idnumber: filterID
//       },
//       limit: 5
//     });
//     if (users && users.length > 0) {
//      // Map the users to their names and balances
//       const forma = users.map(clientinfo => `Please Confirm if these details are correct: \nName:${clientinfo.name} \nSurname:${clientinfo.surname} \nID Number:${clientinfo.idnumber} \nCell No:${clientinfo.cellno} \nBalance:${clientinfo.nettsalary}`);
//       return forma;
//     } else {
//         return null;
//     }
// }
//   module.exports = {
//     getUserInfo: getUserInfo,
//   };
  
  