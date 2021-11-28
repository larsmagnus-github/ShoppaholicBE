var http = require('http');

const FRAME = {
    WIDTH: [25, 600],
    HEIGHT: [25, 600]
};

const MAP = require('./map.json'); 

http.createServer(function (req, res) {
    let result = [
        getRandomArbitrary(0, MAP.frame.width),
        getRandomArbitrary(0, MAP.frame.height)
    ];

    result = JSON.stringify(result);

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(result);
}).listen(8080);

function getRandomArbitrary(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}