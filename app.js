var app = require("express")();
var path = require("path");
var bodyParser = require("body-parser"); // for reading Posted form data into `req.body`
var cookieParser = require("cookie-parser");
var http = require("http").Server(app);
var io = require("socket.io")(http);
var util = require("./lib/util");
var userScore;

app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(require("express").static(path.join(__dirname, "public")));

// view engine setup .. setup ejs engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

var snakes = {};

var food = {
  pos: {
    x: util.random(10, 490),
    y: util.random(10, 490)
  }
};

app.get("/", function(req, res) {
  res.render("login");
});

app.post("/play", function(req, res) {
  var snakeName = req.body.snakeName;

  res.render("index", {
    snakeName: snakeName
  });
});

app.get("/admin", function(req, res) {
  res.render("admin");
});

app.post("/command", function(req, res) {
  var command = req.body.command;

  switch (command) {
    case "clr":
      snakes = {};
      res.render("admin");
      break;

    default:
      break;
  }
});

app.get("*", function(req, res) {
  res.render("login");
});

io.on("connection", function(socket) {
  console.log(socket.id + " joined");

  socket.on("joinRequest", function(data) {
    snakes[socket.id] = {
      id: socket.id,
      name: data.snakeName,
      length: 5,
      startPos: {
        x: util.random(100, 400),
        y: util.random(100, 400)
      },
      size: 5,
      speed: 10,
      color: util.getRandomColor(),
      direction: "none",
      score: 0,
      body: []
    };

    for (var i = 0; i < snakes[socket.id].length; i++) {
      var x = snakes[socket.id].startPos.x - i * snakes[socket.id].size * 2;
      var y = snakes[socket.id].startPos.y;
      snakes[socket.id].body.push({
        x: x,
        y: y
      });
    }

    socket.emit("joinConfirmed", {
      id: socket.id,
      snakes: snakes,
      food: food
    });

    socket.broadcast.emit("newPlayer", {
      id: socket.id,
      playerInfo: snakes[socket.id]
    });
  });

  socket.on("dirChanged", function(data) {
    snakes[data.id].direction = data.direction;
    io.emit("dirChanged", data);
  });

  socket.on("foodEaten", function(data) {
    userScore = snakes[data.id].score++;
    snakes[data.id].body.push({
      x: -100,
      y: -100
    });

    food.pos.x = util.random(10, 490);
    food.pos.y = util.random(10, 490);

    io.emit("foodEaten", {
      id: data.id,
      score: snakes[data.id].score,
      foodPos: {
        x: food.pos.x,
        y: food.pos.y
      }
    });
  });

  socket.on("disconnect", function() {
    snakes[socket.id] = null;
    io.emit("playerLeft", {
      id: socket.id
    });
    console.log(socket.id + " left" + userScore);
  });
});

var port = process.env.PORT || 4000;
http.listen(port, process.env.IP);
console.log("Listening to port " + port);
