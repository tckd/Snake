var express = require('express');

// setup middleware
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname, 'css'));
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
  'running':false, 'snakes':[], 'waiting':[]
};

function createSnake(id){
  return {"id":id, "n":id.substr(0, 7), "d":"høyre", "s":"init", "c":{"x":10,"y":5}};
}

function resetSnakes(){
  for(var i = 0; i<game.waiting.length;i++){
    game.snakes.push(game.waiting[i]);
  }
  game.waiting = [];

  var nrSnakes = game.snakes.length;
  //console.log("nr of snakes: "+nrSnakes);
  var space = Math.floor(100/(nrSnakes+1));
  //console.log("distance bettween snakes: "+space);
  for(var i = 0; i < nrSnakes; i++){
    game.snakes[i].d="høyre";
    game.snakes[i].c.x = 10;
    game.snakes[i].c.y = space*i + space;
    //console.log("Positions: "+JSON.stringify(game.snakes[i].c));
  }
}

function resetSnakesStatus(){
  for(var i = 0; i < game.snakes.length; i++){
    game.snakes[i].s="init";
  }
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
  return;
}

/*
Communication
*/

io.on('connection', function(client){
  //console.log('Snake with id '+client.id+' is connected');

  var snake = createSnake(client.id);
  if(!game.running){
    game.snakes.push(snake);
  } else {
    game.waiting.push(snake);
  }
  io.emit('join', game);

  client.on('disconnect', function(){
    var snake = findSnake(client.id);
    snake.s = "disconnected";
    removeSnake(client.id);
    io.emit('status', snake);
  });

  client.on('name', function(name){
    //console.log('Snake with id '+client.id+' changed name to '+name);
    var snake = findSnake(client.id);
    snake.n = name;
    io.emit('name', snake);
  });

  client.on('d', function(direction){
    //console.log('Snake with id '+client.id+' changed direction to '+direction);
    var snake = findSnake(client.id);
    snake.d = direction;
    io.emit('d', snake);
  });

  client.on('status', function(status){
    //console.log('Snake with id '+client.id+' changed status to '+status);
    var snake = findSnake(client.id);
    snake.s = status;
    io.emit('status', snake);
    if(status=="ready" && isAllSnakesReady() && !game.running){
      resetSnakes();
      game.running = true;
      io.emit('start', game.snakes);
    }
  });

  client.on('win', function(){
    //console.log('Snake with id '+client.id+' Won!');
    game.running = false;
    resetSnakesStatus();
    io.emit('winner', client.id);
  });

  client.on('snakes', function () {
    io.emit('snakes', snakes);
  });

});
