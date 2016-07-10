var appRouter = function(app, db) {
    app.post("/treatment-record", function(req, res) {
        
        db.query("SELECT record_id FROM treatmentRecord WHERE user_id = " + req.query.user_id + " and patient_id = " + req.query.patient_id + " and status='active'", function(err, rows) {
            var data = req.query;
            if (!err && rows.length > 0) { // if there is already a record of this patient, update it
                var record_id = rows[0].record_id
                db.query("UPDATE treatmentRecord SET ? where record_id=" + record_id, data, function(err, rows) {
                    if (err) {
                        return res.status(400).send({ "message": "Saving record failed, missing parameter or malformed syntax" });
                    } else {
                        return res.status(200).send({ "record_id": record_id });
                    }
                });
            } else {
                var record_id = Math.floor(Date.now() / 1000);
                data["record_id"] = record_id;
                db.query("INSERT INTO treatmentRecord SET ?", data, function(err, rows) {
                    console.log(rows);
                    if (err) {
                        console.log(err)
                        var status;
                        var message;
                        if (err.code == 'ER_NO_REFERENCED_ROW_2') {
                            status = 403;
                            message = "Saving record failed, wrong user_id or patient_id";
                        } else {
                            status = 400;
                            message = "Saving record failed, missing parameter or malformed syntax";
                        }
                        return res.status(status).send({ "message": message });
                    } else {
                        return res.status(200).send({ "record_id": record_id });
                    }
                });
            }
        });
    });

    app.put("/treatment-record/:record_id", function(req, res) {
        var data = req.query;
        db.query("UPDATE treatmentRecord SET ? where record_id=" + req.params.record_id, data, function(err, rows) {
            if (err) {
                console.log(err)
                return res.status(400).send({ "message": "Saving data failed, malformed syntax" });
            } else {
                if (rows.affectedRows > 0) {
                    return res.status(200).send({ "message": "Data is saved successfully" });
                } else {
                    return res.status(404).send({ "message": "Saving data failed, record_id not found" });
                }
            }
        });
    });

    app.put("/treatment-record/:record_id/setnull_notif", function(req, res) {
        db.query("UPDATE treatmentRecord SET notif_stage=0, notif_datetime=NULL, notif_times=NULL where record_id=" + req.params.record_id, function(err, rows) {
            if (err) {
                console.log(err)
                return res.status(400).send({ "message": "Saving data failed, malformed syntax" });
            } else {
                if (rows.affectedRows > 0) {
                    return res.status(200).send({ "message": "Data is saved successfully" });
                } else {
                    return res.status(404).send({ "message": "Saving data failed, record_id not found" });
                }
            }
        });
    });

    app.put("/treatment-record/:record_id/setnull_notif2", function(req, res) {
        db.query("UPDATE treatmentRecord SET notif_datetime2=NULL, notif_times2=NULL where record_id=" + req.params.record_id, function(err, rows) {
            if (err) {
                console.log(err)
                return res.status(400).send({ "message": "Saving data failed, malformed syntax" });
            } else {
                if (rows.affectedRows > 0) {
                    return res.status(200).send({ "message": "Data is saved successfully" });
                } else {
                    return res.status(404).send({ "message": "Saving data failed, record_id not found" });
                }
            }
        });
    });

    app.get("/treatment-record/:record_id/blood-tests", function(req, res) {
        db.query("SELECT * FROM bloodTest where record_id=" + req.params.record_id, function(err, rows) {
            if (err) {
                return res.status(500).send({ "message": "internal server error" });
            } else if (rows.length == 0) {
                return res.status(404).send({ "message": "record_id not found" });
            } else {
                return res.status(200).send(rows);
            }
        });
    });
    
    app.post("/treatment-record/:record_id/blood-tests", function(req, res) {
        db.query("INSERT INTO bloodTest SET record_id=" + req.params.record_id + ", ?", req.body, function(err, rows) {
            if (err) {
                console.log(err);
                if (err.code == 'ER_NO_REFERENCED_ROW_2') {
                    return res.status(404).send({ "message": "Saving data failed, record_id not found" });
                } else {
                    return res.status(400).send({ "message": "Saving data failed, malformed syntax" });
                }
            } else {
                return res.status(200).send({ "message": "Blood test result is saved successfully" });
            }
        });
    });
    
    app.get("/treatment-record/:record_id/weakness-tests", function(req, res) {
        db.query("SELECT * FROM motorWeakness where record_id=" + req.params.record_id, function(err, rows) {
            if (err) {
                return res.status(500).send({ "message": "internal server error" });
            } else if (rows.length == 0) {
                return res.status(404).send({ "message": "record_id not found" });
            } else {
                return res.status(200).send(rows);
            }
        });
    });
    
    app.post("/treatment-record/:record_id/weakness-tests", function(req, res) {
        db.query("INSERT INTO motorWeakness SET record_id=" + req.params.record_id + ", ?", req.query, function(err, rows) {
            if (err) {
                console.log(err);
                if (err.code == 'ER_NO_REFERENCED_ROW_2') {
                    return res.status(404).send({ "message": "Saving data failed, record_id not found" });
                } else {
                    return res.status(400).send({ "message": "Saving data failed, malformed syntax" });
                }
            } else {
                return res.status(200).send({ "message": "Motor weakness test result is saved successfully" });
            }
        });
    });
    
    app.get("/treatment-record/:record_id/current-stage", function(req, res) {
        db.query("SELECT s.*, t.times as transaction_times, t.date_time as transaction_datetime FROM transaction t, stage s where t.record_id=" + req.params.record_id + " and t.stage_num = s.stage_num "
        + "and t.date_time = (select MAX(t2.date_time) from transaction t2 where t.record_id = t2.record_id)", function(err, rows) {
            if (err) {
                return res.status(500).send({ "message": "internal server error" });
            } else if (rows.length == 0) {
                return res.status(200).send({});
            } else {
                var stage = rows[0]
                db.query("SELECT * FROM stage_condition where condition_id=" + stage.condition_id, function(err, rows) {
                    stage["condition"] = rows;
                    return res.status(200).send(stage);
                });
            }
        });
    });

    app.get("/treatment-record/:record_id/current-stage/:stage", function(req, res) {
        db.query("SELECT s.*, t.times as transaction_times, t.date_time as transaction_datetime FROM transaction t, stage s where t.record_id=" + req.params.record_id + " and t.stage_num=" + req.params.stage + " and t.stage_num = s.stage_num "
        + "and t.date_time = (select MAX(t2.date_time) from transaction t2 where t.record_id = t2.record_id and t2.stage_num=" + req.params.stage + ")", function(err, rows) {
            if (err) {
                console.log(err)
                return res.status(500).send({ "message": "internal server error" });
            } else if (rows.length == 0) {
                return res.status(200).send({});
            } else {
                var stage = rows[0]
                db.query("SELECT * FROM stage_condition where condition_id=" + stage.condition_id, function(err, rows) {
                    stage["condition"] = rows;
                    return res.status(200).send(stage);
                });
            }
        });
    });
    
    app.post("/treatment-record/:record_id/transaction", function(req, res) {
        db.query("INSERT INTO transaction SET record_id=" + req.params.record_id + ", ?", req.query, function(err, rows) {
            if (err) {
                console.log(err);
                if (err.code == 'ER_NO_REFERENCED_ROW_2') {
                    return res.status(404).send({ "message": "Saving log failed, record_id or stage_num not found" });
                } else if (err.code != "ER_DUP_ENTRY") {
                    return res.status(400).send({ "message": "Saving log failed, malformed syntax" });
                } else {
                    return res.status(200).send({ "message": "Transaction log is saved successfully" });
                }
            } else {
                return res.status(200).send({ "message": "Transaction log is saved successfully" });
            }
        });
    });
    
    app.get("/treatment-record/active", function(req, res) {
        db.query("SELECT * FROM treatmentRecord where user_id=" + req.query.user_id + " and status = 'active' ", function(err, rows) {
            if (err) {
                console.log(err)
                return res.status(500).send({ "message": "internal server error" });
            } else {
                var promises = rows.map(function(record) {
                        return new Promise(function(resolve, reject) {
                            db.query("SELECT * FROM patient where patient_id=" + record.patient_id, function(err, rows) {
                                if (err) { return reject(err); }
                                record["patient"] = rows[0];
                                resolve();
                            });
                        });
                    });   
                    Promise.all(promises)
                        .then(function() { return res.status(200).send(rows); })
                        .catch(console.error);
            }
        });
    });
    
    app.post("/treatment-record/:record_id/closed", function(req, res) {
        db.query("UPDATE treatmentRecord SET status = 'closed' where record_id=" + req.params.record_id, function(err, rows) {
            if (rows.affectedRows > 0) {
                return res.status(200).send({ "message": "Close case successfully" });
            } else {
                return res.status(404).send({ "message": "Saving data failed, record_id not found" });
            }
        });
    });
}

module.exports = appRouter;