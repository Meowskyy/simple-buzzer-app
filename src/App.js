import React from 'react';
import logo from './logo.svg';
import './App.css';
import socketIOClient from "socket.io-client";
const socket = socketIOClient("http://127.0.0.1:3000");

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      response: false,
      endpoint: "http://127.0.0.1:3000",
      player: { id: undefined, name: "yeet" },
      players: undefined
    };

    this.setPlayerName = this.setPlayerName.bind(this);
    this.loveIt = this.loveIt.bind(this);
    this.hateIt = this.hateIt.bind(this);
  }

  setPlayerName() {
    console.log(`rename to: ${this.state.playerName}`);
    socket.emit ('player-rename', this.state.player);
  }

  loveIt() {
    //console.log("Clicked: LOVE");
    socket.emit ('player-love', this.state.player);
  }

  onPlayerLoveItReceived(player) {
    //console.log (player);
    console.log("Received: " + player.name + " loves it");
  }

  hateIt() {
    //console.log("Clicked: HATE");
    socket.emit ('player-hate', this.state.player);
  }

  onPlayerHateItReceived(player) {
    //console.log (player);
    console.log("Received: " + player.name + " hates it");
  }
  
  componentDidMount() {
    socket.on('connect', () => {
      console.log("Connected");
      var player = { id: socket.io.engine.id, name: "yeet" };
      this.setState({ player: player });
    });

    socket.on("players", players => {
       this.setState({ players: players }) 
    });
    socket.on("player-rename", data => { console.log(data) });
    
    socket.on("player-hate", player => { this.onPlayerHateItReceived(player) });
    socket.on("player-love", player => { this.onPlayerLoveItReceived(player) });

    socket.on("player-new-connected", playerId => { 
      var players = this.state.players;
      players.push( {id: playerId, name: "None"} )
      console.log("New player connected: " + playerId);
      this.setState({ players: players })
    });

    socket.on("player-disconnected", playerId => { 
      var players = this.state.players;

      var playerIndex = -1;
      for (var i = 0; i < players.length; i++) {
        if (playerId === players[i].id) {
          playerIndex = i;
          break;
        }
      }

      if (playerIndex > -1) {
        players.splice(playerIndex, 1);
      }

      console.log("Player disconnected: " + playerId);
      this.setState({ players: players })
    });
  }

  renderPlayer(player) {
    return (
      <div className="player-container" key={player.id}>
        <h1>Id: {player.id}</h1> 
        <h1>Name: {player.name}</h1>
      </div>
    )
  }

  renderPlayers() {
    if (this.state.players === undefined) {
      return (null);
    }

    var players = [];

    for (var i = 0; i < this.state.players.length; i++) {
      players.push(this.renderPlayer(this.state.players[i]));
    }

    return (
      <div>
        {players}
      </div>
    );
  }
  

  render() {
    return (
      <div className="App">
        {this.renderPlayers()}

        <h1 onClick={this.setPlayerName}>SET PLAYER NAME</h1>

        <h1 onClick={this.loveIt}>LOVE IT BUTTON</h1>
        <h1 onClick={this.hateIt}>HATE IT BUTTON</h1>
      </div>
    );
  }
}

export default App;
