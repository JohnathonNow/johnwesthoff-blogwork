var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');

var app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/', function(req, res) {
    console.log(req.body);
    var image = req.body.image;
    res.json({"image": image});
});

app.listen(31111);
