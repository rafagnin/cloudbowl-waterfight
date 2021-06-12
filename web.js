const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const maxHitDistance = 2;
const actionThrow = "T";
const actionFoward = "F";
const actionLeft = "L";
const actionRight = "R";
const moves = [actionFoward, actionLeft, actionRight];

const maxConsecutiveThrows = 5;
let consecutiveThrows = 0;
let lastMove = "";
let lastPlayer = "";

app.post('/', async (req, res) => {
  const body = req.body;
  // console.log(body);

  if (player = checkThrow(body)) {
    //stop bulling
    if (player != lastPlayer || consecutiveThrows++ < maxConsecutiveThrows) {
      lastPlayer = player;
      return respondWithAction(res, actionThrow);
    }
  }
  lastPlayer = "";
  consecutiveThrows = 0;

  //find closest player around me
  let nextMove = findClosest(body);
  if (nextMove) return respondWithAction(res, nextMove);

  //if on fire line, move out of the way
  nextMove = checkEscape(body);
  return respondWithAction(res, nextMove);
});

function respondWithAction(res, nextMove) {
  //random move
  if (!nextMove) nextMove = moves[Math.floor(Math.random() * moves.length)];

  //avoid spinning in circles
  if (lastMove == actionLeft && nextMove == actionRight || 
      lastMove == actionRight && nextMove == actionLeft) nextMove = actionFoward;
  
  lastMove = nextMove;
  return res.send(nextMove);
}

//check if "I" can hit someone
function checkThrow(body) {
  const selfUrl = body._links.self.href;
  const rows = body.arena.state;
  const self = rows[selfUrl];

  for (const url in rows) {
    if (url == selfUrl) continue;
    if (checkHit({
          direction: self.direction,
          hitX: rows[url].x,
          hitY: rows[url].y,
          throwX: self.x,
          throwY: self.y,
          dimsX: body.arena.dims[0],
          dimsY: body.arena.dims[1],
        })) return url;
  }
  return false;
}

//check if player can hit another, takes direction and limits into consideration
function checkHit(obj) {
  let limitLeft = obj.throwX-maxHitDistance < 0 ? obj.throwX-maxHitDistance : 0,
      limitRight = obj.throwX+maxHitDistance < obj.dimsX ? obj.throwX+maxHitDistance : obj.dimsX, //CHECK: should be -1
      limitTop = obj.throwY-maxHitDistance < 0 ? obj.throwY-maxHitDistance : 0, 
      limitBottom = obj.throwY+maxHitDistance < obj.dimsY ? obj.throwY+maxHitDistance : obj.dimsY; //CHECK: should be -1

  switch (obj.direction) {
    //facing north, same column, player above
    case "N": if (obj.hitX == obj.throwX && obj.hitY >= limitTop && obj.hitY <= obj.throwY) return true; break;
    //facing south, same column, player below
    case "S": if (obj.hitX == obj.throwX && obj.hitY >= obj.throwY && obj.hitY <= limitBottom) return true; break;
    //facing west, same row, player left
    case "W": if (obj.hitY == obj.throwY && obj.hitX >= limitLeft && obj.hitX <= obj.throwX) return true; break;
    //facing east, same row, player right
    case "E": if (obj.hitY == obj.throwY && obj.hitX >= obj.throwX && obj.hitX <= limitRight) return true; break;
  }
  return false;
}

//check if "someone" can hit me
function checkEscape(body) {
  const selfUrl = body._links.self.href;
  const rows = body.arena.state;
  const self = rows[selfUrl];

  for (const url in rows) {
    if (url == selfUrl) continue;
    let row = rows[url];
    if (checkHit({
          direction: row.direction,
          hitX: self.x,
          hitY: self.y,
          throwX: row.x,
          throwY: row.y,
          dimsX: body.arena.dims[0],
          dimsY: body.arena.dims[1],
        })) return actionFoward; //TODO: find correct move
  }
  return false;
}

//check 3x possible actions F, L, R and success hit in 1 move
function findClosest(body, deep = 0) {
  const selfUrl = body._links.self.href;
  const rows = body.arena.state;
  const self = rows[selfUrl];

  let secondOption = false;
  let cloned = JSON.parse(JSON.stringify(body));

  //check forward
  let nextDirection = self.direction,
      selfX = self.x,
      selfY = self.y;
  switch (self.direction) {
    case "N": if (selfY > 0) selfY--; break;
    case "S": if (selfY < body.arena.dims[1]-1) selfY++; break;
    case "W": if (selfX > 0) selfX--; break;
    case "E": if (selfX < body.arena.dims[0]-1) selfX++; break;
  }
  for (const url in rows) {
    if (url == selfUrl) continue;
    if (checkHit({
          direction: nextDirection,
          hitX: rows[url].x,
          hitY: rows[url].y,
          throwX: selfX,
          throwY: selfY,
          dimsX: body.arena.dims[0],
          dimsY: body.arena.dims[1],
        })) return actionFoward;
  }
  //try 2x moves
  if (deep == 0 && !secondOption) {
    Object.assign(cloned.arena.state[selfUrl], {
      direction: nextDirection,
      x: selfX,
      y: selfY
    });
    secondOption = findClosest(cloned, 1);
  }

  //check right
  nextDirection = self.direction;
  selfX = self.x;
  selfY = self.y;
  switch (self.direction) {
    case "N": nextDirection = "E"; break;
    case "E": nextDirection = "S"; break;
    case "S": nextDirection = "W"; break;
    case "W": nextDirection = "N"; break;
  }
  for (const url in rows) {
    if (url == selfUrl) continue;
    if (checkHit({
          direction: nextDirection,
          hitX: rows[url].x,
          hitY: rows[url].y,
          throwX: selfX,
          throwY: selfY,
          dimsX: body.arena.dims[0],
          dimsY: body.arena.dims[1],
        })) return actionRight;
  }
  //try 2x moves
  if (deep == 0 && !secondOption) {
    Object.assign(cloned.arena.state[selfUrl], {
      direction: nextDirection,
      x: selfX,
      y: selfY
    });
    secondOption = findClosest(cloned, 1);
  }

  //check left
  nextDirection = self.direction;
  selfX = self.x;
  selfY = self.y;
  switch (self.direction) {
    case "N": nextDirection = "W"; break;
    case "W": nextDirection = "S"; break;
    case "S": nextDirection = "E"; break;
    case "E": nextDirection = "N"; break;
  }
  for (const url in rows) {
    if (url == selfUrl) continue;
    if (checkHit({
          direction: nextDirection,
          hitX: rows[url].x,
          hitY: rows[url].y,
          throwX: selfX,
          throwY: selfY,
          dimsX: body.arena.dims[0],
          dimsY: body.arena.dims[1],
        })) return actionLeft;
  }
  //try 2x moves
  if (deep == 0 && !secondOption) {
    Object.assign(cloned.arena.state[selfUrl], {
      direction: nextDirection,
      x: selfX,
      y: selfY
    });
    secondOption = findClosest(cloned, 1);
  }

  return secondOption;
}

app.listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", () => {
  console.log("Server running");
});
module.exports = app