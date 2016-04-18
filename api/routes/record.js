var appRouter = function(app, db) {
    app.post("/treatment-record", function(req, res) {
        var data = req.query;
        var record_id = Math.floor(Date.now() / 1000);
        data["record_id"] = record_id;
        db.query("INSERT INTO treatmentRecord SET ?", data, function(err,rows){
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
    });
    
    app.post("/treatment-record/:record_id", function(req, res) {
        if (!req.query.systemic_bleeding || !req.query.respiratory_failure || !req.query.snake_type) {
            return res.status(400).send({ "message": "Saving record failed, missing parameter" }); 
        } else {
            var data = req.query;
            db.query("UPDATE treatmentRecord SET ? where record_id=" + req.params.record_id, data, function(err,rows){
                if (err) {
                    console.log(err)
                    var status;
                    var message;
                    if (err.code == 'ER_NO_REFERENCED_ROW_2') {
                        status = 403;
                        message = "Saving record failed, wrong user_id or patient_id";
                    } else {
                        status = 400;
                        message = "Saving record failed, malformed syntax";
                    }
                    return res.status(status).send({ "message": message }); 
                } else {
                    return res.status(200).send({ "message": "Data is saved successfully" });
                }
            });
        }
    });
}

module.exports = appRouter;