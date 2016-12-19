
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var crypto = require('crypto');

var appRouter = function(app, db, appUrl) {

    app.post("/register", function(req, res) {
        var data = req.body;
        db.query("INSERT INTO physician SET ?", data, function(err, result) {
            if (err && err.code == "ER_DUP_ENTRY") {
                return res.status(400).send({ "message": "This email is already registered!" });
            } else if (err) {
                console.log(err)
                return res.status(500).send({ "message": "internal server error" });
            } else {
                var subject = 'Snake Envenomation Support System account activation';
                var detail = 'Hi ' + data.physician_name + ",<br><br>" +
                        'Your user account with this e-mail address has been created. <br>' +
                        'Please follow the link below to activate your account. <br>' +
                        '<a href="' + appUrl + '/#/activateAccount/' + result.insertId + '">Click here</a>';
                sendEmail(data.email, subject, detail);
                return res.status(200).send({ "message": "Data is saved successfully" });
            }
        });
    });

    app.post("/resendmail", function(req, res) {
        db.query("SELECT * FROM physician where email='" + req.query.email + "'", function(err,rows){
            var data = rows[0];
            var subject = 'Snake Envenomation Support System account activation';
            var detail = 'Hi ' + data.physician_name + ",<br><br>" +
                'Your user account with this e-mail address has been created. <br>' +
                'Please follow the link below to activate your account. <br>' +
                '<a href="' + appUrl + '/#/activateAccount/' + data.user_id + '">Click here</a>';
            sendEmail(data.email, subject, detail);
            return res.status(200).send({ "message": "Email send successfully" });
        });
    });

    app.post("/forgotpassword", function(req, res) {
        db.query("SELECT * FROM physician where email='" + req.query.email + "'", function(err,rows){
            if (rows.length > 0) {
                var data = rows[0];
                var subject = 'Snake Envenomation Support System reset password';
                var detail = 'Hi ' + data.physician_name + ",<br><br>" +
                    'Please follow the link below to reset your password. <br>' +
                    '<a href="' + appUrl + '/#/resetPassword/' + data.user_id + '/' + crypto.createHash('md5').update(data.email + data.password).digest("hex") + '">Click here</a>';
                sendEmail(data.email, subject, detail);
                console.log(crypto.createHash('md5').update(data.email + data.password).digest("hex"));
                return res.status(200).send({ "message": "Email send successfully" });
            } else {
                return res.status(401).send({ "message": "Account with this email is not found" });
            }
        });
    });

    app.post("/resetpassword/:user_id", function(req, res) {
        db.query("SELECT * FROM physician where user_id=" + req.params.user_id, function(err,rows){
            var data = rows[0];
            var hash = crypto.createHash('md5').update(data.email + data.password).digest("hex")
            if (hash == req.body.token) {
                db.query("UPDATE physician SET password = '" + req.body.password + "' where user_id=" + req.params.user_id, function(err, result) {
                    if (err) {
                        console.log(err)
                        return res.status(500).send({ "message": "internal server error" });
                    } else {
                        return res.status(200).send({ "message": "Reset password successfully" });
                    }
                });
            } else {
                return res.status(401).send({ "message": "Unauthorized" });
            }
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
        db.query("SELECT p.*, t.incident_district, t.incident_province FROM patient p, treatmentRecord t where patient_national_id=" + req.query.id + " and p.patient_id = t.patient_id order by t.incident_date DESC",function(err,rows){
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
        if (req.query.patient_id == 0) {
            db.query("INSERT INTO patient SET ?", req.query, function(err, result) {
                if (err) {
                    console.log(err)
                    return res.status(400).send({ "message": "Saving data failed, malformed syntax" });
                } else {
                    return res.status(200).send({ "patient_id": result.insertId });
                }
            });
        } else {
            db.query("UPDATE patient SET ? where patient_id='" + req.query.patient_id + "'", req.query, function(err, rows) {
                if (err) {
                    console.log(err)
                    return res.status(400).send({ "message": "Saving data failed, malformed syntax" });
                } else {
                    if (rows.affectedRows > 0) {
                        return res.status(200).send({ "patient_id": req.query.patient_id });
                    } else {
                        return res.status(404).send({ "message": "Saving new information failed, wrong patient_id" });
                    }
                }
            });
        }
    });
}

module.exports = appRouter;

function sendEmail(email, subject, detail) {
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
        to: email,
        subject: subject,
        html: detail
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Email sent: ' + info.response);
    });
}