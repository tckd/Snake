var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname, 'css'));

app.get('/', function(req, res){
  res.sendFile(__dirname + 'index.html');
});

server.listen(3000, function(){
  console.log('listening on *:3000');
});

var snakes = [];
var waiting = [];
var started = false;

function createSnake(id){
  var cp = snakes.length*2+2;
  return {"id":id, "d":"right", "s":"init", "c":{"x":2,"y":cp}};
}

function init(){
  for(var i = 0; i<waiting.length;i++){
    snakes.push(waiting[i]);
  }
  waiting = [];
  for(var i = 0; i<snakes.length; i++){
    snakes[i].s="init";
    snakes[i].d="right";
    snakes[i].c={'x':2,'y':i*2+2};
  }
  started = false;
}


function isAllSnakesReady(){
  for(var i = 0; i<snakes.length; i++){
    if(snakes[i].s!="ready") {
      return false;
    }
  }
  return true;
}

function removeSnake(id){
  var gamers = [];
  var removed = false;
  for(var i = 0; i<snakes.length; i++){
    if(snakes[i].id!=id) {
      gamers.push(snakes[i]);
    } else {
      removed = true;
    }
  }
  snakes = gamers;

  if(removed){
    return;
  }

  var waitingSnakes = [];

  for(var i = 0; i<waiting.length; i++){
    if(waiting[i].id!=id) {
      waitingSnakes.push(waiting[i]);
    }
  }
  waiting = waitingSnakes;
}

/* Not used*/
function exists(snakeID){
  for(var i = 0; i<snakes.length; i++){
    if(snakes[i].id==snakeID) {
      return true;
    }
  }
  for(var i = 0; i<waiting.length; i++){
    if(waiting[i].id==snakeID) {
      return true;
    }
  }
  return false;
}

function findSnake(snakeID){
  for(var i = 0; i<snakes.length; i++){
    if(snakes[i].id==snakeID) {
      return snakes[i];
    }
  }
  return;
}

io.on('connection', function(client){
  console.log('Snake with id '+client.id+' is connected');
  var snake = createSnake(client.id);

  if(!started){
    snakes.push(snake);
  } else {
    waiting.push(snake);
  }

  io.emit('join', snakes);

  client.on('disconnect', function(){
    console.log('Snake with id '+client.id+' is disconnected!');
    var snake = createSnake(client.id);
    snake.s="disconnected";
    removeSnake(client.id); // Remove from both list
    io.emit('connectionLost', snake);
  });

  client.on('changeDirection', function(direction){
    console.log('Snake with id '+client.id+' changed direction to '+direction);
    var snake = findSnake(client.id);
    snake.d = direction;
    io.emit('changeDirection', snake);
  });

  client.on('winner', function(){
    console.log('Snake with id '+client.id+' Won!');
    var snake = findSnake(client.id);
    snake.s = "won";
    io.emit('winner', snake);
  });

  client.on('init', function(){
    console.log('Snake with id '+client.id+' Initiated new game!');
    init();
  });

  client.on('crashed', function(){
    console.log('Snake with id '+client.id+' has Crashed!');
    var snake = findSnake(client.id);
    snake.s = "dead";
    io.emit('crashed', snake);
  });

  client.on('ready', function () {
    console.log('Snake with id '+client.id+' is Ready!');
    var snake = findSnake(client.id);
    snake.s = "ready";
    io.emit('ready',snake);
    // start a new game when all the snakes are ready
    if(isAllSnakesReady()){
      console.log('New game started!');
      started = true;
      io.emit('start');
    }
  });

  client.on('snakes', function () {
    console.log("List of snakes requested");
    io.emit('snakes', snakes);
  });

  client.on('waiting', function () {
    console.log("List of wating snakes requested");
    io.emit('waiting', waiting);
  });
});
