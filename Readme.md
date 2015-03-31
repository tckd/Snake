[![tckd logo](img/tckd.png)](http://tckd.me/)

  A multiplayer Snake game

## Running

  Run the following command
```bash
$ node app.js
```

  Then open your browser to play
```web
http://localhost:3000
```


## Features, Feature Requests, Bugs & Enhancements

### Features

  * Multiplayer mode - unlimited amount of players
  * Dynamic adjust to screen size when ever user resizes the screen
  * Single player mode - with levels and high score list // TODO
  * Command search functionality (Inspiration: atom.io) // TODO

### Enhancements

  * Invite other snake players
  * Twitter, Facebook & linkedIn integration

### Bugs
  * Client code not running when window is not active, Possible to cheat, since snakes notifyes its dead.

### Feature Requests

  * Single player mode
  * Levels for single player mode
  * Ability to create custom levels/world
  * High score list for single player mode
  * Wiced sensor controllable
  * Command search functionality (Inspiration: atom.io)
  * Mobile support
  
## Architecture

### V1 (current) - Logic is running in clients

  It leads to major inconsistency issues due to latency in multiplayer mood.

### V2 (To be) - Logic is executed in Server

Theoretically (to be tested), it will solve the inconsistency issues, however there will still be miner latancy issues

This will lead to greate stress on server resources...

### V3 (Todo) - Master-slaves on clients

Use webRTC in order to make one of the players the master.
Now possible to run multiple games at the same time.

### Inpirations to architectural approaches
  * Reactive Systems - http://www.reactivemanifesto.org
```web
systems that are:
 - Responsive
 - Resilient 
 - Elastic
- Message Driven

benefits: systems that are more:
  - flexible, 
  - loosely-coupled
  - scalable
```


  * http://12factor.net

