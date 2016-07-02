var appRouter = function(app, db) {
    app.get("/login", function(req, res) {
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
                        var user_id = Math.floor(Date.now() / 1000);
                        user["user_id"] = user_id;
                        user["physician_name"] = "";
                        user["hospital_name"] = null;
                        user["hospital_province"] = null;
                        console.log("INSERT INTO physician SET user_id='" + user_id + "', physician_id='" + req.query.username + "'");
                        db.query("INSERT INTO physician SET user_id='" + user_id + "', physician_id='" + req.query.username + "'");
                    } else {
                        user = rows[0];
                        delete user["physician_id"];
                    }

                    db.query("SELECT * FROM patient where patient_national_id='" + req.query.patient_national_id + "'",function(err,rows){
                        var patient = {};
                        if (rows.length == 0) {
                            var patient_id = Math.floor(Date.now() / 1000);
                            patient["patient_id"] = patient_id
                            patient["patient_name"] = null;
                            patient["patient_gender"] = null;
                            patient["patient_birthdate"] = null;
                            db.query("INSERT INTO patient SET patient_id='" + patient_id + "', patient_national_id='" + req.query.patient_national_id + "'");
                        } else {
                            patient = rows[0];
                            delete patient["patient_national_id"]
                        }
                        return res.status(200).send({"physician": user, "patient": patient});
                    });
                }
            });
        }
    });

    app.put("/physician/:user_id", function(req, res) {
        if (req.query.physician_name || req.query.hospital_name || req.query.hospital_province) {
            db.query("UPDATE physician SET ? where user_id='" + req.params.user_id + "'", req.query, function(err, rows) {
                if (rows.affectedRows > 0) {
                    return res.status(200).send({ "message": "New information is saved successfully" });
                } else {
                    return res.status(404).send({ "message": "Saving new information failed, wrong user_id" });
                }
            });
        } else {
            return res.status(400).send({ "message": "Saving new information failed, missing parameters" });
        }
    });
    
    app.put("/patient/:patient_id", function(req, res) {
        db.query("UPDATE patient SET ? where patient_id='" + req.params.patient_id + "'", req.query, function(err, rows) {
            if (err) {
                console.log(err)
                return res.status(400).send({ "message": "Saving data failed, malformed syntax" });
            } else {
                if (rows.affectedRows > 0) {
                    return res.status(200).send({ "message": "New information is saved successfully" });
                } else {
                    return res.status(404).send({ "message": "Saving new information failed, wrong patient_id" });
                }
            }
        });
    });
}

module.exports = appRouter;