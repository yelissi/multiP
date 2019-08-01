var socket = io();
var timer;
var i, j; // for loop
var myId;

socket.emit("joinRequest", {
  snakeName: document.getElementById("snakeName").textContent
});

var snakes = {}; // snakes array

var canvas, ctx;

var food = {
  pos: {
    x: 100,
    y: 100
  },
  fillColor: "yellow",
  borderColor: "red",
  size: 5
};
var radios = window.document.getElementsByName("avatar");

for (var i = 0, length = radios.length; i < length; i++) {
  if (radios[i].checked) {
    console.log(radios[i].value);

    break;
  }
}

function createCanvas() {
  canvas = document.createElement("canvas");
  ctx = canvas.getContext("2d");
  canvas.style.backgroundColor = "white";

  document.body.appendChild(canvas);

  setSizeAndPosition();

  var ix, iy, fx, fy;

  function mouseDown(e) {
    ix = e.clientX;
    iy = e.clientY;
  }

  function mouseup(e) {
    fx = e.clientX;
    fy = e.clientY;

    if (Math.abs(fx - ix) > Math.abs(fy - iy)) {
      // right-left
      if (fx > ix && snakes[myId].direction !== "left") changeDir("right");
      else if (snakes[myId].direction !== "left") changeDir("left");
    } else if (Math.abs(fx - ix) < Math.abs(fy - iy)) {
      // up-down
      if (fy > iy && snakes[myId].direction !== "up") changeDir("down");
      else if (snakes[myId].direction !== "down") changeDir("up");
    }
  }

  canvas.addEventListener("mousedown", function(e) {
    mouseDown(e);
  });

  canvas.addEventListener("touchstart", function(e) {
    mouseDown(e);
  });

  canvas.addEventListener("mouseup", function(e) {
    mouseup(e);
  });

  canvas.addEventListener("touchend", function(e) {
    mouseup(e);
  });
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw all snakes
  for (var s in snakes) {
    var snake = snakes[s];
    if (snake !== null) drawSnake(snake);
  }

  //draw food
  drawFood();
  drawScore();
}

function drawSnake(snake) {
  for (i = snake.body.length - 1; i >= 0; i--) {
    if (i !== 0) {
      snake.body[i].x = snake.body[i - 1].x;
      snake.body[i].y = snake.body[i - 1].y;
    } else {
      if (snake.direction === "right") {
        snake.body[0].x += snake.speed;
      } else if (snake.direction === "left") {
        snake.body[0].x -= snake.speed;
      } else if (snake.direction === "up") {
        snake.body[0].y -= snake.speed;
      } else if (snake.direction === "down") {
        snake.body[0].y += snake.speed;
      }
    }

    ctx.beginPath();
    ctx.strokeStyle = snake.color;
    ctx.fillStyle = snake.color;
    ctx.arc(snake.body[i].x, snake.body[i].y, snake.size, 0, 2 * Math.PI);

    if (i === 0) ctx.fill();
    else ctx.stroke();
  }

  // collission with walls
  if (snake.body[0].x > canvas.width) {
    snake.body[0].x = 0;
  } else if (snake.body[0].x < 0) {
    snake.body[0].x = canvas.width;
  } else if (snake.body[0].y < 0) {
    snake.body[0].y = canvas.height;
  } else if (snake.body[0].y > canvas.height) {
    snake.body[0].y = 0;
  }

  if (checkCollission(snake, food)) {
    socket.emit("foodEaten", {
      id: myId
    });
  }
}

function drawFood() {
  ctx.beginPath();
  ctx.fillStyle = food.fillColor;
  ctx.arc(food.pos.x, food.pos.y, food.size, 0, 2 * Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = food.borderColor;
  ctx.arc(food.pos.x, food.pos.y, food.size + 2, 0, 2 * Math.PI);
  ctx.stroke();
}

function drawScore() {
  var startX = 20;
  var startY = 20;
  ctx.font = "10px sans-serif";
  for (var s in snakes) {
    var snake = snakes[s];

    if (snake !== null) {
      ctx.fillStyle = snake.color;
      ctx.fillText(snake.name + " : " + snake.score, startX, startY);
      startY += parseInt(ctx.font);
    }
  }
}

function checkCollission(snake, cir2) {
  var dis = Math.sqrt(
    Math.pow(snake.body[0].x - cir2.pos.x, 2) +
      Math.pow(snake.body[0].y - cir2.pos.y, 2)
  );

  if (dis < snake.size + cir2.size) return true;
  else return false;
}

function setSizeAndPosition() {
  if (window.innerHeight < window.innerWidth) {
    canvas.height = window.innerHeight - 10;
    canvas.width = window.innerHeight - 10;
  } else {
    canvas.height = window.innerWidth - 10;
    canvas.width = window.innerWidth - 10;
  }

  canvas.style.position = "absolute";
  canvas.style.borderStyle = "solid";
  canvas.style.borderWidth = 1;
  canvas.style.left = window.innerWidth / 2 - canvas.width / 2;
  canvas.style.top = window.innerHeight / 2 - canvas.height / 2;
}

window.onkeydown = function(e) {
  if (e.keyCode >= 37 && e.keyCode <= 40) {
    var snake = snakes[myId];

    if (e.keyCode === 38 && snakes[myId].direction !== "down") {
      //up
      changeDir("up");
    } else if (e.keyCode === 40 && snakes[myId].direction !== "up") {
      //down
      changeDir("down");
    } else if (e.keyCode === 39 && snakes[myId].direction !== "left") {
      //right
      changeDir("right");
    } else if (e.keyCode === 37 && snakes[myId].direction !== "right") {
      //left
      changeDir("left");
    }

    socket.emit("dirChanged", {
      id: myId,
      direction: snakes[myId].direction,
      pos: snakes[myId].body[0]
    });
  }
};

window.onresize = function() {
  setSizeAndPosition();
};

function changeDir(dir) {
  var snake = snakes[myId];
  snake.direction = dir;
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isEmpty(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) return true;
  }
  return false;
}

socket.on("joinConfirmed", function(data) {
  myId = data.id;
  snakes = data.snakes;
  food.pos = data.food.pos;
  //console.log(snakes[myId]);
});

socket.on("dirChanged", function(data) {
  snakes[data.id].body[0] = data.pos;
  snakes[data.id].direction = data.direction;

  //console.log(snakes[data.id]);
});

socket.on("foodEaten", function(data) {
  snakes[data.id].score = data.score;
  snakes[data.id].body.push({
    x: -50,
    y: -50
  });
  food.pos = data.foodPos;
});

socket.on("newPlayer", function(data) {
  snakes[data.id] = data.playerInfo;
});

socket.on("playerLeft", function(data) {
  snakes[data.id] = null;
});

createCanvas();

timer = setInterval(update, 100);
