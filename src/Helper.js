const fileName = "cach";
const fs = require("fs");
const path = require("path");

// export const resetVisiterData = (message, f) => {
//   let data = f.map((person) => {
//     let record = {};
//     person.unum == message.from
//       ? (record = {
//           ...person,
//           answerd: false,
//           isComing: false,
//           withAmount: 0,
//         })
//       : (record = person);

//     return record;
//   });
//   // console.log("new data ", data);
//   fs.writeFileSync(
//     path.resolve(__dirname, `./${fileName}.json`),
//     JSON.stringify(data),
//     (err) => {
//       console.log(err);
//     }
//   );
// };

// export const setCurrentUsser = () => {
//   JSON.parse(
//     fs.readFileSync(path.resolve(__dirname, `./${fileName}.json`), (err) => {
//       if (err) throw err;
//       console.log(err, "See resaults in myApiRes.txt");
//     })
//   );
//   let currentIndex;
//   f.map((person, index) => {
//     if (person.unum == message.from) {
//       currentIndex = index;
//     }
//   });
//   return currentIndex;
// };

// export const readFileData = () => {
//  let res = await JSON.parse(
//     fs.readFileSync(path.resolve(__dirname, `./${fileName}.json`), (err) => {
//       if (err) throw err;
//       console.log(err, "See resaults in myApiRes.txt");
//     })
//   );
//   return res.resetVisiterData
// };

// export const updateIsComing = async (isAns, message, status) => {
//   fs.writeFileSync(
//     path.resolve(__dirname, `./${fileName}.json`),
//     JSON.stringify(
//       isAns.map((person) => {
//         let record = {};
//         person.unum == message.from
//           ? (record = { ...person, answerd: true, isComing: status })
//           : (record = person);

//         return record;
//       })
//     ),
//     (err) => {
//       console.log(err);
//     }
//   );
// };



// export const testPath = (isAns, currentIndex, type) => {
//   if (type == "need Amount") {
//     if (
//       isAns[currentIndex].answerd &&
//       isAns[currentIndex].withAmount == 0 &&
//       isAns[currentIndex].isComing
//     )
//       return true;
//   }
// if(type == "answer not Clear"){
//   if(!isAns[currentIndex].answerd) return true
// }

// if(type == "data update req"){
// if(!isAns[currentIndex].isComing) return true
// }
// }


// export const checkAmount = (isAns, message, currentIndex) => {
//   let num2 = 1;
//   try {
//     if (isAns [currentIndex].isComing) {
//       amountRange.forEach((num) => {
//         let index = message.body.indexOf(num);
//         message.body.indexOf(num) != -1
//           ? (num2 = parseInt(message.body.charAt(index)))
//           : (num2 = num2);
//         console.log("num2 in for each ", num2);
//       });
//     }
//   } catch (e) {
//     console.log(e);
//   }
//   console.log("num 2", num2);
//   fs.writeFileSync(
//     path.resolve(__dirname, `./${fileName}.json`),
//     JSON.stringify(
//       isAns.map((person) => {
//         let record = {};
//         person.unum == message.from
//           ? (record = { ...person, withAmount: num2 })
//           : (record = person);

//         return record;
//       })
//     ),
//     (err) => {
//       console.log(err);
//     }
//   );
//   let locationMsg = {
//     lan: 32.3213,
//     lat: 34.23124,
//     des: " מיקום אולמי התחת שלי",
//     msg: "ברוך השם",
//   };
//   return locationMsg;
// };
