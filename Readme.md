[![tckd logo](img/tckd.png)](http://tckd.me/)

  A multiplayer Snake game

## Running

  Run the following command
```bash
$ node app.js
```

  Then go to
```web
http://localhost:3000
```

and follow instructions...


## Features

  * Multiplayer Snake game
  * Highly efficient

## Bugs, Enhancements, Feature Requests

### Bugs

  * Restart new game not working
  * Client code not running when window is not active!
  * Single player, can never win! - Fix won() method
```
if(single player mode){
  var lost = lost();
  // todo
} else {
  var win = won();
  // todo
}
```
### Enhancements

  * Instructions page on how to SnakeRide -- done
  * Once the 'Start' button is clicked, the button should change to something else, indicating waiting for other players...

### Feature Requests

  * Single player mode
  * Levels for single player mode
  * Ability to create custom levels/world
  * High score list for single player mode
  * Wiced sensor controllable
  * Add command search functionality (Inspiration: atom.io)
  * Dynamic adjust to screen size by using dynamic cell size -- done
  * 

## License

  [No License](LICENSE)
