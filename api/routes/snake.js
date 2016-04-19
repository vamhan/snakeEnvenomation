var appRouter = function(app, db) {
    
    app.get("/snakes", function(req, res) {
        db.query("SELECT * FROM snake",function(err,rows){
            if (err) {
                return res.status(500).send({ "message": "internal server error" });
            } else {
                return res.status(200).send(rows);
            }
        });
    });

    app.get("/snakes/:snake_id/stages", function(req, res) {
        db.query("SELECT st.* FROM snake sn, stage st where sn.snake_id = st.snake_id",function(err,rows){
            if (err) {
                return res.status(500).send({ "message": "internal server error" });
            } else {
                var stages = rows;
                var counter = 0;
                for (var i = 0; i < rows.length; i++) {
                    var stage = stages[i]
                    db.query("SELECT * FROM condition where condition_id=" + stage.condition_id, function(err, rows) {
                        stage["condition"] = rows;
                        counter++;
                    });
                }
                while(counter == stages.length){}
                return res.status(200).send(stages);
            }
        });
    });
    
}

module.exports = appRouter;