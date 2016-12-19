var appUrl = "http://www.topwork.asia:8100"
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var appRouter = function(app, db) {

    app.post("/register", function(req, res) {
        var data = req.body;
        db.query("INSERT INTO physician SET ?", data, function(err, result) {
            if (err && err.code == "ER_DUP_ENTRY") {
                return res.status(400).send({ "message": "This email is already registered!" });
            } else if (err) {
                console.log(err)
                return res.status(500).send({ "message": "internal server error" });
            } else {
                var transporter = nodemailer.createTransport(smtpTransport({
                    host: 'smtp.zoho.com',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'contact@topwork.asia',
                        pass: 'oooaaakkk'
                    }
                }));

                // setup e-mail data with unicode symbols
                var mailOptions = {
                    from: 'contact@topwork.asia', 
                    to: data.email,
                    subject: 'Snake Envenomation Support System account activation',
                    html: 'Hi ' + data.physician_name + ",<br><br>" +
                        'Your user account with this e-mail address has been created. <br>' +
                        'Please follow the link below to activate your account. <br>' +
                        '<a href="' + appUrl + '/#/activateAccount/' + result.insertId + '">Click here</a>'
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        return console.log(error);
                    }
                    console.log('Message sent: ' + info.response);
                });
                return res.status(200).send({ "message": "Data is saved successfully" });
            }
        });
    });

    app.post("/resendmail", function(req, res) {
        db.query("SELECT * FROM physician where email='" + req.query.email + "'", function(err,rows){
            var data = rows[0];
            var transporter = nodemailer.createTransport(smtpTransport({
                host: 'smtp.zoho.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'contact@topwork.asia',
                    pass: 'oooaaakkk'
                }
            }));

            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: 'contact@topwork.asia', 
                to: data.email,
                subject: 'Snake Envenomation Support System account activation',
                html: 'Hi ' + data.physician_name + ",<br><br>" +
                    'Your user account with this e-mail address has been created. <br>' +
                    'Please follow the link below to activate your account. <br>' +
                    '<a href="' + appUrl + '/#/activateAccount/' + data.user_id + '">Click here</a>'
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    console.log(error);
                } else {
                    console.log('Message sent: ' + info.response);
                }
            });
        });
    });

    app.put("/activate/:user_id", function(req, res) {
        db.query("UPDATE physician SET is_activate = 1 where user_id = " + req.params.user_id, null, function(err, result) {
            if (err) {
                console.log(err)
                return res.status(500).send({ "message": "internal server error" });
            } else {
                return res.status(200).send({ "message": "Data is saved successfully" });
            }
        });
    });

    app.get("/login", function(req, res) {
        db.query("SELECT * FROM physician where email='" + req.query.email + "'", function(err,rows){
            var user = {};
            if (err) {
                console.log(err)
                return res.status(500).send({ "message": "internal server error" });
            } else {
                if (rows.length == 0) {
                    return res.status(401).send({ "message": "Unauthorized" });
                } else {
                    user = rows[0];
                    return res.status(200).send({"physician": user});
                }
            }
        });
    });

    /*app.get("/login", function(req, res) {
        var data;
        if (!req.query.username || !req.query.patient_national_id) {
            return res.status(400).send({ "message": "username or patient_national_id parameter is missing" });
        } else {
            db.query("SELECT * FROM physician where physician_id='" + req.query.username + "'",function(err,rows){
                var user = {};
                if (err) {
                    console.log(err)
                    return res.status(500).send({ "message": "internal server error" });
                } else {
                    if (rows.length == 0) {
                        //return res.status(401).send({ "message": "Login failed, wrong username" });
                        user["physician_name"] = "";
                        user["hospital_name"] = "";
                        user["hospital_province"] = "";
                        //console.log("INSERT INTO physician SET user_id='" + user_id + "', physician_id='" + req.query.username + "'");
                        db.query("INSERT INTO physician SET ?", {physician_id : req.query.username}, function(err, result) {
                            user["user_id"] = result.insertId;
                        });
                    } else {
                        user = rows[0];
                        delete user["physician_id"];
                    }

                    db.query("SELECT * FROM patient where patient_national_id='" + req.query.patient_national_id + "'",function(err,rows){
                        var patient = {};
                        if (rows.length == 0) {
                            patient["patient_name"] = "";
                            patient["patient_gender"] = null;
                            patient["patient_birthdate"] = null;
                            db.query("INSERT INTO patient SET ?", {patient_national_id : req.query.patient_national_id}, function(err, result) {
                                patient["patient_id"] = result.insertId;
                                return res.status(200).send({"physician": user, "patient": patient});
                            });
                        } else {
                            patient = rows[0];
                            delete patient["patient_national_id"]
                            return res.status(200).send({"physician": user, "patient": patient});
                        }
                    });
                }
            });
        }
    });*/

    app.put("/physician/:user_id", function(req, res) {
        db.query("UPDATE physician SET ? where user_id='" + req.params.user_id + "'", req.query, function(err, rows) {
            if (rows.affectedRows > 0) {
                return res.status(200).send({ "message": "New information is saved successfully" });
            } else {
                return res.status(404).send({ "message": "Saving new information failed, wrong user_id" });
            }
        });
    });

    app.get("/patient", function(req, res) {
        db.query("SELECT * FROM patient where patient_national_id='" + req.query.id + "'",function(err,rows){
            var patient = {};
            patient.patient_national_id = req.query.id
            if (rows.length == 0) {
                return res.status(200).send({"patient": patient});
            } else {
                patient = rows[0];
                return res.status(200).send({"patient": patient});
            }
        });
    });
    
    app.post("/patient", function(req, res) {
        db.query("SELECT * FROM patient where patient_national_id='" + req.query.patient_national_id + "'",function(err,data){
            if (data.length == 0) {
                db.query("INSERT INTO patient SET ?", req.query, function(err, result) {
                    if (err) {
                        console.log(err)
                        return res.status(400).send({ "message": "Saving data failed, malformed syntax" });
                    } else {
                        return res.status(200).send({ "patient_id": result.insertId });
                    }
                });
            } else {
                db.query("UPDATE patient SET ? where patient_national_id='" + req.query.patient_national_id + "'", req.query, function(err, rows) {
                    if (err) {
                        console.log(err)
                        return res.status(400).send({ "message": "Saving data failed, malformed syntax" });
                    } else {
                        if (rows.affectedRows > 0) {
                            return res.status(200).send({ "patient_id": data[0].patient_id });
                        } else {
                            return res.status(404).send({ "message": "Saving new information failed, wrong patient_id" });
                        }
                    }
                });
            }
        });
    });
}

module.exports = appRouter;
