const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.post('/', function (req, res) {
  console.log(req.body);
  const moves = ['T', 'F', 'T', 'L', 'T', 'R', 'T'];
  res.send(moves[Math.floor(Math.random() * moves.length)]);
});

app.listen(process.env.PORT || 8080);
