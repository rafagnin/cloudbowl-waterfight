const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const maxHitDistance = 3;
const actionThrow = "T";
const actionForward = "F";
const actionLeft = "L";
const actionRight = "R";
const moves = [actionForward, actionLeft, actionRight];
const maxConsecutiveThrows = 10;
let cache = {}

app.post('/', async (req, res) => {
  const body = req.body;
  let session = cache[body._links.self.href];
  if (typeof session === 'undefined') session = cache[body._links.self.href] = {lastMove: "", lastPlayer: "", throws: 0};
  // console.log(body);

  if (player = checkThrow(body)) {
    //limit throws against same player
    if (player != session.lastPlayer) {
      session.lastPlayer = player;
      session.throws = 1;
      return respondWithAction(res, actionThrow, body);
    }
    if (++session.throws <= maxConsecutiveThrows) {
      return respondWithAction(res, actionThrow, body);
    }
  }

  let nextMove;
  if (nextMove = findClosest(body)) return respondWithAction(res, nextMove, body);
  //TODO: if (nextMove = checkEscape(body)) return respondWithAction(res, nextMove, body);

  //if on fire line, move out of the way
  return respondWithAction(res, checkRandom(body), body);
});

function respondWithAction(res, nextMove, body) {
  let session = cache[body._links.self.href];
  return res.send(session.lastMove = nextMove);
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
  let limitLeft = obj.throwX-maxHitDistance >= 0 ? obj.throwX-maxHitDistance : 0,
      limitRight = obj.throwX+maxHitDistance < obj.dimsX-1 ? obj.throwX+maxHitDistance : obj.dimsX-1,
      limitTop = obj.throwY-maxHitDistance >= 0 ? obj.throwY-maxHitDistance : 0, 
      limitBottom = obj.throwY+maxHitDistance < obj.dimsY-1 ? obj.throwY+maxHitDistance : obj.dimsY-1;

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

function checkRandom(body) {
  let session = cache[body._links.self.href];

  //random move
  let nextMove = moves[Math.floor(Math.random() * moves.length)];
  //avoid spinning in circles
  if (session.lastMove == actionLeft && nextMove == actionRight ||
    session.lastMove == actionRight && nextMove == actionLeft) nextMove = actionForward;

  //check if moving against walls, move around
  let selfUrl = body._links.self.href;
  let rows = body.arena.state;
  const self = rows[selfUrl];

  switch (self.direction) {
    //facing north
    case "N": 
      if (nextMove == actionForward) {
        if (self.y == 0) nextMove = actionRight;
        else for (url in rows) {
            if (rows[url].x == self.x && rows[url].y == self.y-1) { nextMove = actionRight; break; }
        }
      }
      if (nextMove == actionRight && self.x == body.arena.dims[0]-1) nextMove = actionLeft
      else if (nextMove == actionLeft && self.x == 0) nextMove = actionRight
      break;
    //facing south
    case "S": 
      if (nextMove == actionForward) {
        if (self.y == body.arena.dims[1]-1) nextMove = actionRight;
        else for (url in rows) {
            if (rows[url].x == self.x && rows[url].y == self.y+1) { nextMove = actionRight; break; }
        }
      }
      if (nextMove == actionRight && self.x == 0) nextMove = actionLeft
      else if (nextMove == actionLeft && self.x == body.arena.dims[0]-1) nextMove = actionRight
      break;
    //facing west
    case "W":
      if (nextMove == actionForward) {
        if (self.x == 0) nextMove = actionRight;
        else for (url in rows) {
            if (rows[url].x == self.x-1 && rows[url].y == self.y) { nextMove = actionRight; break; }
        }
      }
      if (nextMove == actionRight && self.y == 0) nextMove = actionLeft
      else if (nextMove == actionLeft && self.y == body.arena.dims[1]-1) nextMove = actionRight
      break;
    //facing east
    case "E": 
      if (nextMove == actionForward) {
        if (self.x == body.arena.dims[0]-1) nextMove = actionRight;
        else for (url in rows) {
            if (rows[url].x == self.x+1 && rows[url].y == self.y) { nextMove = actionRight; break; }
        }
      }
      if (nextMove == actionRight && self.y == body.arena.dims[1]-1) nextMove = actionLeft
      else if (nextMove == actionLeft && self.y == 0) nextMove = actionRight
      break;
  }

  return nextMove;
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
        })) {
          //TODO: find best move
          return actionForward;
        }
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
  let session = cache[body._links.self.href];

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
    if (url == selfUrl || 
        url == session.lastPlayer && session.throws >= maxConsecutiveThrows) continue;
    if (checkHit({
          direction: nextDirection,
          hitX: rows[url].x,
          hitY: rows[url].y,
          throwX: selfX,
          throwY: selfY,
          dimsX: body.arena.dims[0],
          dimsY: body.arena.dims[1],
        })) return actionForward;
  }
  //try 2x moves
  if (deep == 0 && !secondOption) {
    Object.assign(cloned.arena.state[selfUrl], {
      direction: nextDirection,
      x: selfX,
      y: selfY
    });
    if (findClosest(cloned, 1)) secondOption = actionForward;
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
    if (url == selfUrl || 
        url == session.lastPlayer && session.throws >= maxConsecutiveThrows) continue;
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
    if (findClosest(cloned, 1)) secondOption = actionRight;
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
    if (url == selfUrl || 
        url == session.lastPlayer && session.throws >= maxConsecutiveThrows) continue;
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
    if (findClosest(cloned, 1)) secondOption = actionLeft;
  }

  return secondOption;
}

app.listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", () => {
  console.log("Server running");
});
module.exports = app