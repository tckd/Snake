var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

server.listen(3000, function(){
  console.log('listening on *:3000');
});

var players = [];

function createPlayer(id){
  var cp = players.length*2+2;
  return {"id":id, "d":"right", "s":"Init", "c":{"x":2,"y":cp}};
}

function isAllPlayerReady(){
  for(var i = 0; i<players.length; i++){
    if(players[i].s!="Ready") {
      return false;
    }
  }
  return true;
}

function removePlayer(id){
  var gamers = [];
  for(var i = 0; i<players.length; i++){
    if(players[i].id!=id) {
      gamers.push(players[i]);
    }
  }
  players = gamers;
}

function exists(playerID){
  for(var i = 0; i<players.length; i++){
    if(players[i].id==playerID) {
      return true;
    }
  }
  return false;
}

function findPlayer(playerID){
  for(var i = 0; i<players.length; i++){
    if(players[i].id==playerID) {
      return players[i];
    }
  }
  return;
}

function init(){
  for(var i = 0; i<players.length; i++){
    players[i].s="Init";
    players[i].c={'x':2,'y':i*2+2};
  }
}


io.on('connection', function(client){
  if(!exists(client.id)){
    console.log('Player with id '+client.id+' is connected');
    var player = createPlayer(client.id);
    players.push(player);
    io.emit('join', player);
  }

  client.on('history', function(){
    // Send list of players (historic data)
    io.emit('history', {"playerID": client.id, 'players':players});
  });

  client.on('disconnect', function(){
    console.log('Player with id '+client.id+' is disconnected!');
    var player = createPlayer(client.id);
    player.s="Disconnected";
    removePlayer(client.id);
    io.emit('connectionLost', player);
  });

  client.on('changeDirection', function(direction){
    if(exists(client.id)){
      console.log('Player with id '+client.id+' changed direction to '+direction);
      var player = findPlayer(client.id);
      player.d = direction;
      io.emit('changeDirection', player);
    }
  });

  client.on('winner', function(){
    if(exists(client.id)){
      console.log('Player with id '+client.id+' Won!');
      var player = findPlayer(client.id);
      player.s = "Won";
      io.emit('winner', player);
      init();
    }
  });

  client.on('crashed', function(){
    if(exists(client.id)){
      console.log('Player with id '+client.id+' has Crashed!');
      var player = findPlayer(client.id);
      player.s = "Dead";

      console.log(JSON.stringify(player));
      io.emit('crashed', player);
    }
  });

  // start a new game when all the players are ready
  client.on('ready', function () {
    if(exists(client.id)){
      console.log('Player with id '+client.id+' is Ready!');
      var p = findPlayer(client.id);
      p.s = "Ready";
      io.emit('ready',p);
      if(isAllPlayerReady()){
        io.emit('start');
      }
    }
  });

  // Someone requested the list of players
  client.on('list', function () {
    console.log("List of players requested");
    io.emit('list', players);
  });
});
