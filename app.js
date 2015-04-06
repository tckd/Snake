var express = require('express');

// setup middleware
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname, 'css'));
app.use(express.static(__dirname, 'js'));
app.use(express.static(__dirname, 'apprise'));
app.use(express.static(__dirname, 'img'));

// render index page
app.get('/', function(req, res){
  res.sendFile(__dirname + 'index.html');
});

// There are many useful environment variables available in process.env.
// VCAP_APPLICATION contains useful information about a deployed application.
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
// TODO: Get application information and use it in your app.

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
// TODO: Get service credentials and communicate with bluemix services.

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3000);
// Start server
server.listen(port, host);
console.log('listening on *' + port);

var game = {
  'running':false,
  'snakes':[],
  'waiting':[],
  'cells':[],
  'w':100,
  'h':100
};

var loop;

function createSnake(id){
  return {"id":id, "n":id.substr(0, 10), "d":"høyre", "s":"init", "c":{"x":10,"y":5}};
}

function resetGame(){
  // move all waiting snakes to game snakes
  for(var i = 0; i<game.waiting.length;i++){
    game.snakes.push(game.waiting[i]);
  }
  game.waiting = [];

  var nrSnakes = game.snakes.length;
  var space = Math.floor(100/(nrSnakes+1));
  for(var i = 0; i < nrSnakes; i++){
    game.snakes[i].d="høyre";
    game.snakes[i].c.x = 10;
    game.snakes[i].c.y = space*i + space;
  }

  game.cells = [];
}

function isAllSnakesReady(){
  for(var i = 0; i<game.snakes.length; i++){
    if(game.snakes[i].s!="ready") {
      return false;
    }
  }
  return true;
}

function removeSnake(id){
  var gamers = [];
  var removed = false
  for(var i = 0; i<game.snakes.length; i++){
    if(game.snakes[i].id!=id) {
      gamers.push(game.snakes[i]);
    } else {
      removed = true;
    }
  }
  game.snakes = gamers;

  if(removed){
    return;
  }

  var waitingSnakes = [];
  for(var i = 0; i<game.waiting.length; i++){
    if(game.waiting[i].id!=id) {
      waitingSnakes.push(game.waiting[i]);
    }
  }
  game.waiting = waitingSnakes;
}

function findSnake(snakeID){
  for(var i = 0; i<game.snakes.length; i++){
    if(game.snakes[i].id==snakeID) {
      return game.snakes[i];
    }
  }
}

function tic(){
  for(var index in game.snakes) {
    var snake = game.snakes[index];
    if(snake.s=="ready"){
      move(snake);
      var colided = checkCollision(snake);
      if(colided){
        snake.s ="dead";
        io.emit('changed',snake);
        if(haveAWinner()){
          var s = getWinner();
          s.s = "won";
          io.emit('changed', s);
          game.running = false;
          clearInterval(loop);
          //console.log("Game ended: "+JSON.stringify(game));
        }
      } else {
        var c = {'x':snake.c.x, 'y':snake.c.y}
        game.cells.push(c);
      }
    }
  }
  //console.log(loop);
  io.emit('tic',game);
}

function move(snake){
  if(snake.d == "høyre"){
    snake.c.x++;
  } else if(snake.d == "venstre"){
    snake.c.x--;
  } else if(snake.d == "opp"){
    snake.c.y--;
  } else if(snake.d == "ned") {
    snake.c.y++;
  }
}

function haveAWinner(){
  var nrLiveSnakes = 0;
  for(var i = 0; i<game.snakes.length; i++){
    if(game.snakes[i].s=="ready"){
      nrLiveSnakes++;
    }
  }
  if(nrLiveSnakes==1){
    return true;
  } else {
    return false;
  }
}

function getWinner(){
  for(var i = 0; i<game.snakes.length; i++){
    if(game.snakes[i].s=="ready"){
      return game.snakes[i];
    }
  }
  return {};
}

function checkCollision(snake) {
  var x = snake.c.x;
  var y = snake.c.y;
  if(x == -1 || x == game.w || y == -1 || y == game.h){
    return true;
  }

  for(var i = 0; i < game.cells.length; i++) {
    var c = game.cells[i];
    if(c.x == x && c.y == y){
      return true;
    }
  }
  return false;
}


/*-----------
Communication
-----------*/
io.on('connection', function(client){
  //console.log('Snake with id '+client.id+' is connected');
  var snake = createSnake(client.id);
  if(!game.running){
    game.snakes.push(snake);
  } else {
    game.waiting.push(snake);
  }
  io.emit('join', game);

  client.on('direction', function(direction){
    findSnake(client.id).d = direction;
  });

  client.on('disconnect', function(){
    var snake = findSnake(client.id);
    snake.s = "disconnected";
    io.emit('changed', snake);
    removeSnake(client.id);
  });

  client.on('name', function(name){
    var snake = findSnake(client.id);
    snake.n = name;
    io.emit('changed', snake);
    //console.log('Snake with id '+client.id+' changed name: '+name);
  });

  client.on('status', function(status){
    var snake = findSnake(client.id);
    snake.s = status;
    io.emit('changed', snake);
    //console.log('Status changed: '+JSON.stringify(snake));
    if(isAllSnakesReady() && !game.running){
      resetGame();
      game.running = true;
      io.emit('start', game);
      //console.log('Game started: '+JSON.stringify(game));
      if(typeof loop !=="undefined"){
        clearInterval(loop);
      }
      loop = setInterval(tic, 40);
    }
  });
});
