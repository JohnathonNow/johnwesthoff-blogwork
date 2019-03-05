var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');

var app = express()

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/love';

var gDB;
var gNotes;

MongoClient.connect(url, function(err, db) {
    if (err != null) {
        db.close();
        process.exit();
    } else {
        gDB = db;
        gNotes = db.collection('notes');
        app.listen(31111);
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/', function(req, res) {
    var image = req.body.image;
    gNotes.insert({"image": image, "date": new Date()});
    console.log(image);
    res.json({"image": image});
});

