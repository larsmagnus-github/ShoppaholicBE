var express = require('express');
var app = express();

app.use(express.json());
const querystring = require('querystring');

var fs = require("fs");
var _ = require('underscore')._;

const MAP = require('./map.json'); 
const SHELVES = require('./shelves.json'); 
let que = require('./que.json'); 

app.get('/shopper/:shopperId/que', function (req, res) {
    let shopperID = req.params.shopperId;
    let customerActionQue = que[shopperID] || [];
    res.send(JSON.stringify(customerActionQue));
});

app.get('/shopper/:shopperId/que/next', function (req, res) {
    let shopperID = req.params.shopperId;

    if (!_.has(que, shopperID)) {
        return res.send('{}');
    }

    let next = que[shopperID].que[que[shopperID].indexPointer];
    if (next) {
        que[shopperID].indexPointer++;
    }

    res.send(JSON.stringify(next));
});

app.get('/shoppers/que', function (req, res) {
    let shopperIDs = req.query.shopperIDs;

    let shopperQue = {};
    shopperIDs = shopperIDs.split(',').forEach(function(shopperID) {
        let shelfId = SHELVES[Math.floor(Math.random() * SHELVES.length)];
        shopperQue[shopperID.trim()] = shelfId;
    });

    res.send(JSON.stringify(shopperQue));
});

app.post('/shopper/:shopperId/que', function (req, res) {
    let shopperID = req.params.shopperId;
    if (!_.has(que, shopperID)) {
        que[shopperID] = {
            "que": [],
            "indexPointer": 0
        };
    }

    console.log('body', req.body);

    que[shopperID].que.push(req.body);

    res.send();
});

app.get('/shopper/next', function (req, res) {
    let shelfId = SHELVES[Math.floor(Math.random() * SHELVES.length)];

    res.send(shelfId);
});

app.get('/shopper/active', function (req, res) {
    let randomInt = function (max) {
      return Math.floor(Math.random() * max);
    }
    que[randomInt(1000)] = {};
    var activeShopperIds = Object.keys(que);
    console.log("activeShopperIds", activeShopperIds)
    res.send(JSON.stringify(activeShopperIds));
});

var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
});
