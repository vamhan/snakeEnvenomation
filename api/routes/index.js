var appRouter = function(app) {
    app.get("/account", function(req, res) {
        var db = req.con;
        var data = "";
        db.query('SELECT * FROM user',function(err,rows){
            if (err) {
                return res.send({ "status": "error", "message": err });
            } else {
                var data = rows;
                return res.send(data)
            }
        });
        /*var accountMock = {
            "username": "nraboy",
            "password": "1234",
            "twitter": "@nraboy"
        }
        if (!req.query.username) {
            return res.send({ "status": "error", "message": "missing username" });
        } else if (req.query.username != accountMock.username) {
            return res.send({ "status": "error", "message": "wrong username" });
        } else {
            return res.send(accountMock);
        }*/
    });

    app.post("/account", function(req, res) {
        if (!req.body.username || !req.body.password || !req.body.twitter) {
            return res.send({ "status": "error", "message": "missing a parameter" });
        } else {
            return res.send(req.body);
        }
    });
}

module.exports = appRouter;