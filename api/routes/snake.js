var appRouter = function(app, db) {
    
    app.get("/snakes", function(req, res) {
        db.query("SELECT * FROM snake",function(err,rows){
            if (err) {
                console.log(err)
                return res.status(500).send({ "message": "internal server error" });
            } else {
                return res.status(200).send(rows);
            }
        });
    });

    app.get("/snakes/:snake_id/stages", function(req, res) {
        db.query("SELECT * FROM stage where snake_id = " + req.params.snake_id,function(err,rows){
            if (err) {
                return res.status(500).send({ "message": "internal server error" });
            } else {
                var stages = rows;
                db.query("SELECT * FROM stage where stage_num=4 or stage_num=33 or stage_num=36 or stage_num=45",function(err,rows){
                    rows.map(function(row) {
                        stages.push(row);
                    });    
                    var promises = stages.map(function(stage) {
                        return new Promise(function(resolve, reject) {
                            db.query("SELECT * FROM stage_condition where condition_id=" + stage.condition_id, function(err, rows) {
                                if (err) { return reject(err); }
                                stage["condition"] = rows;
                                resolve();
                            });
                        });
                    });   
                    Promise.all(promises)
                        .then(function() { return res.status(200).send(stages); })
                        .catch(console.error);
                });
            }
        });
    });
    
}

module.exports = appRouter;