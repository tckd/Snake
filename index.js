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
var wait = [];

function createSnake(id){
  var cp = snakes.length*2+2;
  return {"id":id, "d":"right", "s":"init", "c":{"x":2,"y":cp}};
}

function isAllSnakeReady(){
  for(var i = 0; i<snakes.length; i++){
    if(snakes[i].s!="Ready") {
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

  var waiters = [];
  for(var i = 0; i<wait.length; i++){
    if(wait[i].id!=id) {
      waiters.push(wait[i]);
    }
  }
  wait = waiters;
}

function exists(snakeID){
  for(var i = 0; i<snakes.length; i++){
    if(snakes[i].id==snakeID) {
      return true;
    }
  }
  for(var i = 0; i<wait.length; i++){
    if(wait[i].id==snakeID) {
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

function init(){
  for(var i = 0; i<wait.length;i++){
    snakes.push(wait[i]);
    wait = [];
  }
  for(var i = 0; i<snakes.length; i++){
    snakes[i].s="Init";
    snakes[i].c={'x':2,'y':i*2+2};
  }
}


io.on('connection', function(client){
  if(!exists(client.id)){
    console.log('Snake with id '+client.id+' is connected');
    var snake = createSnake(client.id);

    snakes.push(snake);
    io.emit('join', snakes);
  }

  client.on('disconnect', function(){
    console.log('Snake with id '+client.id+' is disconnected!');
    var snake = createSnake(client.id);
    snake.s="disconnected";
    removeSnake(client.id);
    io.emit('connectionLost', snake);
  });

  client.on('changeDirection', function(direction){
    if(exists(client.id)){
      console.log('Snake with id '+client.id+' changed direction to '+direction);
      var snake = findSnake(client.id);
      snake.d = direction;
      io.emit('changeDirection', snake);
    }
  });

  client.on('winner', function(){
    if(exists(client.id)){
      console.log('Snake with id '+client.id+' Won!');
      var snake = findSnake(client.id);
      snake.s = "won";
      io.emit('winner', snake);
      init();
    }
  });

  client.on('crashed', function(){
    if(exists(client.id)){
      console.log('Snake with id '+client.id+' has Crashed!');
      var snake = findSnake(client.id);
      snake.s = "dead";
      io.emit('crashed', snake);
    }
  });

  // start a new game when all the snakes are ready
  client.on('ready', function () {
    if(exists(client.id)){
      console.log('Snake with id '+client.id+' is Ready!');
      var p = findSnake(client.id);
      p.s = "ready";
      io.emit('ready',p);
      if(isAllSnakeReady()){
        io.emit('start');
      }
    }
  });

  // Someone requested the list of snakes
  client.on('list', function () {
    console.log("List of snakes requested");
    io.emit('list', snakes);
  });
});
