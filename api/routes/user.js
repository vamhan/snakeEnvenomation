var appRouter = function(app, db) {
    app.get("/login", function(req, res) {
        var data;
        if (!req.query.username || !req.query.patient_national_id) {
            return res.status(400).send({ "message": "username or patient_national_id parameter is missing" });
        } else {
            db.query("SELECT * FROM physician where physician_id='" + req.query.username + "'",function(err,rows){
                if (err) {
                    return res.status(500).send({ "message": "internal server error" });
                } else if (rows.length == 0) {
                    return res.status(401).send({ "message": "Login failed, wrong username" });
                } else {
                    var user = rows[0];
                    db.query("SELECT * FROM hospital where hospital_id='" + user.hospital_id + "'",function(err,rows){
                        user["hospital"] = rows[0];
                        db.query("SELECT * FROM patient where patient_national_id='" + req.query.patient_national_id + "'",function(err,rows){
                            patient = rows[0];
                            return res.status(200).send({"physician": user, "patient": patient});
                        });
                    });
                }
            });
        }
    });

    app.put("/physician", function(req, res) {
        db.query("SELECT * FROM physician where user_id='" + req.query.user_id + "'",function(err,rows){
            if (err) {
                return res.status(500).send({ "message": "internal server error" });
            } else if (rows.length == 0) {
                return res.status(403).send({ "message": "Saving new information failed, wrong user_id" });
            } else {
                if (req.query.physician_name) {
                    db.query("UPDATE physician SET physician_name='" + req.query.physician_name + "' where user_id='" + req.query.user_id + "'");
                }
                if (req.query.hospital_name || req.query.hospital_province) {
                    var s = {};
                    if (req.query.hospital_name) {
                        s["hospital_name"] = hospital_name;
                    }
                    if (req.query.hospital_province) {
                        s["hospital_province"] = hospital_province;
                    }
                    db.query("UPDATE hospital SET ? where hospital_id='" + row[0].hospital_id + "'", s);
                    return res.status(200).send({ "message": "New information is saved successfully" });
                }
            }
        });
    });
    
    app.put("/patient", function(req, res) {
        db.query("SELECT * FROM patient where patient_id='" + req.query.patient_id + "'",function(err,rows){
            if (err) {
                return res.status(500).send({ "message": "internal server error" });
            } else if (rows.length == 0) {
                return res.status(403).send({ "message": "Saving new information failed, wrong patient_id" });
            } else {
                if (req.query.patient_name || req.query.patient_gender || req.query.patient_birthdate) {
                    var s = {};
                    if (req.query.patient_name) {
                        s["patient_name"] = patient_name;
                    }
                    if (req.query.patient_gender) {
                        s["patient_gender"] = patient_gender;
                    }
                    if (req.query.patient_birthdate) {
                        s["patient_birthdate"] = patient_birthdate;
                    }
                    db.query("UPDATE patient SET ? where patient_id='" + req.query.patient_id + "'", s);
                    return res.status(200).send({ "message": "New information is saved successfully" });
                }
            }
        });
    });
}

module.exports = appRouter;