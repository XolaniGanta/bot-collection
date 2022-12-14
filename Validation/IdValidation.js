// const { isValidDate } = require('is-valid-date');

// function isValid(idNumber) {
//   // Check that the number is 13 digits long
//   if (idNumber.length !== 13) {
//     return false;
//   }

//   // Check that the first 6 digits represent the person's date of birth in the format YYMMDD
//   const dateOfBirth = idNumber.substring(0, 6);
//   if (!isValidDate(dateOfBirth)) {
//     return false;
//   }

//   // Perform the modulus 11 test to validate the entire number
//   const weightingFactors = [2, 4, 8, 5, 10, 9];
//   let total = 0;
//   for (let i = 0; i < 6; i++) {
//     total += weightingFactors[i] * parseInt(idNumber[i], 10);
//   }
//   if (total % 11 !== 0) {
//     return false;
//   }
//   // If all checks pass, the number is valid
//   return true;
// }

// module.exports = {
//   isValid: isValid
// }
