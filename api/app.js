var express = require("express");
var bodyParser = require("body-parser");
var app = express();
 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
  next();      
}); 

// DataBase 
var mysql = require("mysql");
var con = mysql.createConnection({
  //host: "cdss.topwork.asia",
  host: "localhost",
  user: "cdss",
  password: "cdss1q2w3e",
  database: "cdss"
});
/*var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "test_table"
});*/
con.query("SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE'");
con.connect(function(err){
  if(err){
    console.log(err);
    return;
  }
  console.log('Connection established');
});

var router = express.Router();

var routes = require("./routes/user.js")(router, con);
var routes = require("./routes/record.js")(router, con);
var routes = require("./routes/snake.js")(router, con);
app.use('/snake-envenomation/api', router);
 
var server = app.listen(9081, function () {
    console.log("Listening on port %s...", server.address().port);
});