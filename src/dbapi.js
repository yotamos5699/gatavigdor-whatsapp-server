const express = require("express");
const router = express.Router();
router.use(express.json());
const pgClient = require("./pgConfig");

router.get("/api/GETans", async (req, res) => {
    console.log('in api get ans')
  pgClient.query(`Select * from ans`, (err, result) => {
    if (!err) {
        console.log(result.rows)
      res.send(result.rows);
      res.end
    }else{
    res.send(err)
    res.end
    }
  });
  pgClient.end;
});

const logAnswer = (message) => {
    console.log("in log");
    //console.log(message)
    let {
      id: { id },
      timestamp,
      body,
      from,
      _data: { notifyName },
      location,
    } = message;
  
    console.log("datasafaasa", message._data);
  
    let insertQuery = `insert into ANS(ID, timeStemp, Msg, senderNum , senderName, geoLocation) 
                         values('${id}', '${timestamp}', '${body}', '${from}','${notifyName}','${location}')`;
    pgClient.query(insertQuery, (err) => {
      let logMsg = !err ? "Insertion was successful" : err.message;
      console.log(logMsg);
    });
  
    pgClient.end;
  };
  
 //con pgClient.connect();

module.exports.logAnswer=logAnswer
module.exports = router;
