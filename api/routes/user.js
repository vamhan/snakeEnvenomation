var appRouter = function(app, db) {
    app.get("/login", function(req, res) {
        var data;
        if (!req.query.username || !req.query.patient_national_id) {
            return res.status(400).send({ "message": "username or patient_national_id parameter is missing" });
        } else {
            db.query("SELECT * FROM physician where physician_id='" + req.query.username + "'",function(err,rows){
                if (err) {
                    console.log(err)
                    return res.status(500).send({ "message": "internal server error" });
                } else if (rows.length == 0) {
                    return res.status(401).send({ "message": "Login failed, wrong username" });
                } else {
                    var user = rows[0];
                    delete user["physician_id"];
                    db.query("SELECT * FROM patient where patient_national_id='" + req.query.patient_national_id + "'",function(err,rows){
                        if (rows.length > 0) {
                            patient = rows[0];
                            delete patient["patient_national_id"]
                            return res.status(200).send({"physician": user, "patient": patient});
                        } else {
                            return res.status(200).send({"physician": user});
                        }
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
        if (req.query.patient_name || req.query.patient_gender || req.query.patient_birthdate) {
            db.query("UPDATE patient SET ? where patient_id='" + req.params.patient_id + "'", req.query, function(err, rows) {
                if (err) {
                    return res.status(400).send({ "message": "Saving data failed, malformed syntax" });
                } else {
                    if (rows.affectedRows > 0) {
                        return res.status(200).send({ "message": "New information is saved successfully" });
                    } else {
                        return res.status(404).send({ "message": "Saving new information failed, wrong patient_id" });
                    }
                }
            });
        } else {
            return res.status(400).send({ "message": "Saving new information failed, missing parameters" });
        }
    });
}

module.exports = appRouter;