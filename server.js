var express = require('express');
var app = express();

const env = require('./env.json'); 

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

function validateShopperId(shopperId) {
    return true; // @TODO
};

function validateData(data) {
    return data.filter(product => {
        // Mandatory attributes
        return product.id && product.price && product.category;
    }).length > 0;
}

function sanitizeData(eventData) {
    return eventData.map(product => { 
        return {
            'id': _.isString(product.id) && _.escape(product.id),
            'name': _.isString(product.name) && _.escape(product.name),
            'price': !isNaN(product.price) && parseFloat(product.price),
            'brand': _.isString(product.brand) && _.escape(product.brand),
            'category': _.isString(product.category) && _.escape(product.category),
            'variant': _.isString(product.variant) && _.escape(product.variant),
            'quantity': !isNaN(product.quantity) && parseInt(product.quantity)
        }
    });
};

function getEvent(eventType) {
    return _.keys(env.events).indexOf(eventType) !== -1 && env.events[eventType];
}

function queData(shopperId, eventType, eventData, currencyCode) {
    let data = sanitizeData(eventData);
    let event = getEvent(eventType);
    currencyCode = currencyCode || 'WRONG'; // @TODO handle appropriately

    if (!validateData(data)) { throw new Error('Improper eventData paramter ' + JSON.stringify(data, null, '  ')); }
    if (!event) { throw new Error('Improper eventType paramter ' + eventType); }
    if (!validateShopperId(shopperId)) { throw new Error('shopperId [' + shopperId + '] could not be validated.'); }

    if (!_.has(que, shopperId)) {
        que[shopperId] = {
            "que": [],
            "indexPointer": 0,
            'lastUpdate': 0,
            'endOfQue': true
        };
    }

    que[shopperId].que.push({
        'event': eventType,
        'latency': event.latency,
        'speedMultiplier': event.speedMultiplier,
        'eventData': data
    });

    que[shopperId].lastUpdate = Date.now();
    que[shopperId].endOfQue = false;
    que[shopperId].currencyCode = currencyCode;
};

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

app.post('/shopper/:shopperId/:eventType', function (req, res) {
    let shopperId = req.params.shopperId;
    let eventType = req.params.eventType;
    console.log('[productImpression] shopperId', shopperId, 'eventType', eventType);

    let data = req.body;
    if (_.isObject(data) && !_.isArray(data)) {
        data = [data];
    }

    queData(shopperId, eventType, data, 'SEK');

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
