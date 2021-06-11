const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const maxHitDistance = 3;
const actionThrow = "T";
const actionFoward = "F";
const actionLeft = "L";
const actionRight = "R";

app.post('/', async (req, res) => {
  const body = req.body;
  // console.log(body);

  if (checkThrow(body)) return res.send(actionThrow);
  return res.send(findBestAction(body));
});

//check if "I" can hit someone
function checkThrow(body) {
  const selfUrl = body._links.self.href;
  const rows = body.arena.state;
  const self = rows[selfUrl];

  let throwX = self.x, 
      throwY = self.y;
  let limitLeft = self.x-maxHitDistance < 0 ? self.x-maxHitDistance : 0,
      limitRight = self.x+maxHitDistance < body.arena.dims[0] ? self.x+maxHitDistance : body.arena.dims[0], 
      limitTop = self.y-maxHitDistance < 0 ? self.y-maxHitDistance : 0, 
      limitBottom = self.y+maxHitDistance < body.arena.dims[1] ? self.y+maxHitDistance : body.arena.dims[1];

  for (const url in rows) {
    if (url == selfUrl) continue;
    let row = rows[url];

    let hitX = row.x, 
        hitY = row.y;
    switch (self.direction) {
      //facing north, same column, player above
      case "N": if (hitX == throwX && hitY >= limitTop && hitY <= throwY) return true; break;
      //facing south, same column, player below
      case "S": if (hitX == throwX && hitY >= throwY && hitY <= limitBottom) return true; break;
      //facing west, same row, player left
      case "W": if (hitY == throwY && hitX >= limitLeft && hitX <= throwX) return true; break;
      //facing east, same row, player right
      case "E": if (hitY == throwY && hitX >= throwX && hitX <= limitRight) return true; break;
    }
  }
  return false;
}

//check if "someone" can hit me
function checkEscape(body) {
  const selfUrl = body._links.self.href;
  const rows = body.arena.state;
  const self = rows[selfUrl];
  const hitX = self.x, 
        hitY = self.y;

  for (const url in rows) {
    if (url == selfUrl) continue;
    let row = rows[url];
    let throwX = row.x, 
        throwY = row.y;
    let limitLeft = row.x-maxHitDistance, 
        limitRight = row.x+maxHitDistance, 
        limitTop = row.y-maxHitDistance, 
        limitBottom = row.y+maxHitDistance;
    switch (row.direction) {
      //facing north, same column, player below
      case "N": if (hitX == throwX && hitY >= limitTop && hitY <= throwY) return true; break;
      //facing south, same column, player above
      case "S": if (hitX == throwX && hitY >= throwY && hitY <= limitBottom) return true; break;
      //facing west, same row, player right
      case "W": if (hitY == throwY && hitX >= limitLeft && hitX <= throwX) return true; break;
      //facing east, same row, player left
      case "E": if (hitY == throwY && hitX >= throwX && hitX <= limitRight) return true; break;
    }
  }
  return false;
}

function findBestAction(body) {
  //let nextAction = checkEscape(body);

  //find closest player around me

  //chase highest score player

  const moves = [actionFoward, actionLeft, actionRight];
  return moves[Math.floor(Math.random() * moves.length)];
}

app.listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", () => {
  console.log("Server running");
});
module.exports = app