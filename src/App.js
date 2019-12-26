import React from 'react';
import ReactAudioPlayer from 'react-audio-player'
import './App.css';
import socketIOClient from "socket.io-client";

var hateImg = require('./hate.png');
var bgImg = require('./bg.png');
var loveImg = require('./bg.png');

var dislikeSoundEffect = require('./dislike.mp3')

const socket = socketIOClient("http://127.0.0.1:3000");

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      response: false,
      endpoint: "http://127.0.0.1:3000",
      player: { id: undefined, name: "yeet", state: "none", flicker: false },
      players: undefined,
      flicker: false
    };

    this.setPlayerName = this.setPlayerName.bind(this);
    this.loveIt = this.loveIt.bind(this);
    this.hateIt = this.hateIt.bind(this);
    this.updatePlayerState = this.updatePlayerState.bind(this);
  }

  setPlayerName() {
    console.log(`rename to: ${this.state.playerName}`);
    socket.emit ('player-rename', this.state.player);
  }

  loveIt() {
    var player = this.state.player;

    player.state = "Love";

    this.setState({ player: player });
    socket.emit ('player-love', this.state.player);

    this.updatePlayerState(player);

    this.startFlicker(player, 2000);
  }

  onPlayerLoveItReceived(player) {
    console.log("Received: " + player.name + " loves it");
    this.updatePlayerState(player);
    
    this.startFlicker(player, 2000);
  }

  hateIt() {
    var player = this.state.player;

    player.state = "Hate";

    this.setState({ player: player });

    socket.emit ('player-hate', this.state.player);

    this.updatePlayerState(player);

    this.startFlicker(player, 2000);
  }

  onPlayerHateItReceived(player) {
    console.log("Received: " + player.name + " hates it");

    this.updatePlayerState(player);

    this.startFlicker(player, 2000);
  }

  startFlicker(player, duration) {
    var players = this.state.players;

    for (var i = 0; i < players.length; i++) {
      if (player.id === players[i].id) {
        players[i].flicker = true;
        break;
      }
    }

    this.setState({ players: players });

    setTimeout(() => {
      for (var i = 0; i < players.length; i++) {
        if (player.id === players[i].id) {
          players[i].flicker = false;
          break;
        }
      }

      this.setState({flicker: false});
    }, duration)
  }

  // Get the new player state from server and replace the current one with it
  updatePlayerState(player) {
    var players = this.state.players;

    for (var i = 0; i < players.length; i++) {
      if (player.id === players[i].id) {
        players[i] = player;
        break;
      }
    }

    this.setState({ players: players });
  }
  
  componentDidMount() {
    socket.on('connect', () => {
      console.log("Connected");
      var player = { id: socket.io.engine.id, name: "None", state: "None" };
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
      players.push( {id: playerId, name: "None", state: "None"} )
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
    var color = "green" 
    switch (player.state) {
      default:
        color = bgImg;
        break;
      case "None":
        color = bgImg;
        break;
      case "Hate":
        color = hateImg;
        break;
      case "Love":
        color = loveImg;
        break;
    }

    if (player.flicker) {
      return (
        <div className="player-container" key={player.id}>
          <ReactAudioPlayer src={dislikeSoundEffect} autoPlay />
          <img className="state-img flicker" src={color} alt="state" />
          <h1 className="player-name">{player.name}</h1>
        </div>
      )
    }

    return (
      <div className="player-container" key={player.id}>
        <img className="state-img" src={color} alt="state" />
        <h1 className="player-name">{player.name}</h1>
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
      <div className="players">
        {players}
      </div>
    );
  }
  

  render() {
    return (
      <div className="App">
        {this.renderPlayers()}

        <div className="btn btn-love unselectable" onClick={this.loveIt}>LOVE IT</div>
        <div className="btn btn-hate unselectable" onClick={this.hateIt}>HATE IT</div>
      </div>
    );
  }
}

export default App;
