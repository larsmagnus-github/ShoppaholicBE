var express = require('express');
var app = express();

// Allows to interpret json body
app.use(express.json());
// Need to figure out how to allow cors on specific endpoints
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


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
        if (que[shopperID].indexPointer >= que[shopperID].que.length) {
            que[shopperID].endOfQue = true;
        }
    }

    res.send(JSON.stringify(next));
});

app.get('/shoppers/que', function (req, res) {
    let shopperIDs = req.query.shopperIDs;
    let shopperQue = {};

    console.log('req.query', req.query);

    if (_.isEmpty(shopperIDs)) {
        return shopperQue;
    }

    shopperIDs = shopperIDs.split(',').forEach(function(shopperID) {
        // let shelfId = SHELVES[Math.floor(Math.random() * SHELVES.length)];
        // shopperQue[shopperID.trim()] = shelfId;

        if (!_.has(que, shopperID)) {
            return;
        }

        let next = que[shopperID].que[que[shopperID].indexPointer];
        if (next) {
            // @TODO put a abstraction layer that handles que states
            que[shopperID].indexPointer++;
            shopperQue[shopperID.trim()] = next;
        } else {
            que[shopperID].endOfQue = true
        }
    });

    console.log('shopperQue', shopperQue);

    res.send(JSON.stringify(shopperQue));
});

app.post('/shopper/:shopperId/productImpression', function (req, res) {
    let shopperID = req.params.shopperId;
    console.log('shopperID', shopperID);
    if (!_.has(que, shopperID)) {
        que[shopperID] = {
            "que": [],
            "indexPointer": 0,
            'lastUpdate': 0,
            'endOfQue': true
        };
    }

    let productImpressions = req.body;
    if (_.isObject(productImpressions) && !_.isArray(productImpressions)) {
        productImpressions = [productImpressions];
    }

    console.log('productImpressions', productImpressions);

    if (_.isArray(productImpressions)) {
        que[shopperID].que = que[shopperID].que.concat(productImpressions.map( productImpression => {
            return {
                id: productImpression.id,
                latency: 0.2,
                speedMultiplier: 2 
            };
        }));
    } else {
        throw new Error('Body incorrect format. Expecting Object or Array, found ' + productImpressions);
    }

    que[shopperID].lastUpdate = Date.now();
    que[shopperID].endOfQue = false;

    res.send();
});

app.post('/shopper/:shopperId/que', function (req, res) {
    let shopperID = req.params.shopperId;
    console.log('shopperID', shopperID);
    if (!_.has(que, shopperID)) {
        que[shopperID] = {
            "que": [],
            "indexPointer": 0
        };
    }

    console.log('body', req.body);
    console.log('que[shopperID].que', que[shopperID].que);

    if (_.isArray(req.body)) {
        que[shopperID].que = que[shopperID].que.concat(req.body);
    } else if (_isObject(req.body)) {
        que[shopperID].que.push(req.body);
    } else {
        throw new Error('Body incorrect format. Expecting Object or Array, found ' + req.body);
    }

    res.send();
});

app.get('/shopper/next', function (req, res) {
    let shelfId = SHELVES[Math.floor(Math.random() * SHELVES.length)];
    res.send(shelfId);
});

app.get('/shopper/active', function (req, res) {
    // let randomInt = function (max) {
    //   return Math.floor(Math.random() * max);
    // }
    // que[randomInt(1000)] = {};
    let existingShopperIds = Object.keys(que);
    console.log("existingShopperIds", existingShopperIds);
    let activeShopperIds = existingShopperIds.filter((_shopperId) => !que[_shopperId].endOfQue);
    console.log("activeShopperIds", activeShopperIds)
    res.send(JSON.stringify(activeShopperIds));
});

app.get('/que', function (req, res) {
    res.send(JSON.stringify(que));
});

var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
});
