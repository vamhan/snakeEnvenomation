var express = require("express");
var bodyParser = require("body-parser");
var app = express();
 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();      
}); 

// DataBase 
var mysql = require("mysql");
var con = mysql.createConnection({
  host: "cdss.topwork.asia",
  user: "cdss",
  password: "cdss1q2w3e",
  database: "cdss"
});
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
app.use('/api', router);
 
var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});