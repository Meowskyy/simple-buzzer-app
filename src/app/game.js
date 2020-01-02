import React from 'react';

import ReactAudioPlayer from 'react-audio-player'
import '../App.css';
import socketIOClient from "socket.io-client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons'

var hateImg = require('../img/hate.png');
var bgImg = require('../img/bg.png');
var loveImg = require('../img/like.png');

var dislikeSoundEffect = require('../audio/dislike.mp3')
var likeSoundEffect = require('../audio/like.mp3')

export class Game extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        connected: false,
        response: false,
        endpoint: localStorage.getItem('endpoint'),
        player: { id: undefined, name: localStorage.getItem('playername'), state: "none", flicker: false, host: false },
        players: undefined,
        flicker: false,
        socket: undefined,
        spectating: this.props.match
      };
  
      this.updateEndpoint = this.updateEndpoint.bind(this);
      this.connectToServer = this.connectToServer.bind(this);
      this.connectToServerWithIP = this.connectToServerWithIP.bind(this);
      this.updateSocket = this.updateSocket.bind(this);
      this.updateName = this.updateName.bind(this);

      this.renderButtons = this.renderButtons.bind(this);
      this.keypressFunction = this.keypressFunction.bind(this);
  
      this.setPlayerName = this.setPlayerName.bind(this);
      this.loveIt = this.loveIt.bind(this);
      this.hateIt = this.hateIt.bind(this);
      this.updatePlayerState = this.updatePlayerState.bind(this);
      this.updateHostState = this.updateHostState.bind(this);
      this.resetPlayers = this.resetPlayers.bind(this);
    }

    componentDidMount() {
        if (this.state.spectating.params.ip !== undefined) 
        {
            console.log(this.state.spectating);
            this.setState({ 
                endpoint: this.state.spectating.params.ip,
                player: { id: undefined, name: "Spectator", state: "none", flicker: false }         
            });
            this.connectToServerWithIP(this.state.spectating.params.ip);
        }

        document.addEventListener("keydown", this.keypressFunction, false);
    }

    keypressFunction(e) {
        console.log(e.keyCode);
        if(e.keyCode === 82 && this.state.socket !== undefined && this.state.player.host) {
            this.resetPlayers();
        }

        if(e.keyCode === 32 && this.state.socket !== undefined) {
            this.hateIt();
        }
    }
  
    setPlayerName() {
      console.log(`rename to: ${this.state.playerName}`);
      this.state.socket.emit ('player-rename', this.state.player);
    }
  
    loveIt() {
      var player = this.state.player;
  
      if (player.state === "None") {
        player.state = "Love";
  
        this.setState({ player: player });
        this.state.socket.emit ('player-love', this.state.player);
  
        this.updatePlayerState(player);
  
        this.startFlicker(player, 800);
      }
    }
  
    onPlayerLoveItReceived(player) {
      console.log("Received: " + player.name + " loves it");
      this.updatePlayerState(player);
      
      this.startFlicker(player, 800);
    }
  
    hateIt() {
      var player = this.state.player;
  
      if (player.state === "None") {
        player.state = "Hate";
  
        this.setState({ player: player });
  
        this.state.socket.emit ('player-hate', this.state.player);
  
        this.updatePlayerState(player);
  
        this.startFlicker(player, 800);
      }
    }
  
    onPlayerHateItReceived(player) {
      console.log("Received: " + player.name + " hates it");
  
      this.updatePlayerState(player);
  
      this.startFlicker(player, 800);
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

      
    // Get the new player state from server and replace the current one with it
    updateHostState(players) {
        var player = this.state.player;

        for (var i = 0; i < players.length; i++) {
            if (this.state.player.id === players[i].id) {
                player = players[i];
                break;
            }
        }

        this.setState({ player: player });
    }
  
    updateEndpoint(e) {
      this.setState({ endpoint: e.target.value });
    }

    connectToServer() {
        this.setState({ socket: socketIOClient(this.state.endpoint)})

        localStorage.setItem('endpoint', this.state.endpoint);
        localStorage.setItem('playername', this.state.player.name);
    }  
  
    connectToServerWithIP(ip) {
        console.log("Connection IP during socket init: " + ip);
        this.setState({ socket: socketIOClient(ip)})
    }  
  
    updateSocket() {
      this.state.socket.on('connect', () => {
        var player = { id: this.state.socket.io.engine.id, name: this.state.player.name, state: "None", host: false };
  
        this.setState({ player: player });
        this.state.socket.emit("player-rename", player);
      });

      this.state.socket.on("players", players => {
        this.setState({ players: players });
        this.updateHostState(players);
      });
      
      this.state.socket.on("player-host", player => 
      { 
          console.log("Hosting");
          this.setState({ 
              player: player
          }) 
      });

      
      this.state.socket.on("player-hate", player => { this.onPlayerHateItReceived(player) });
      this.state.socket.on("player-love", player => { this.onPlayerLoveItReceived(player) });

      this.state.socket.on("reset-player", () => {
        this.setState({ player: { id: this.state.player.id, name: this.state.player.name, state: "None", flicker: false, host: this.state.player.host }})
      }) 
  
      this.state.socket.on("player-new-connected", players => { 
        this.setState({ players: players })
      });
  
      this.state.socket.on("player-rename", player => { console.log(player); this.updatePlayerState(player) });
  
      this.state.socket.on("player-disconnected", playerId => { 
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
  
  
      this.setState({ connected: true });
    }
  
    updateName(e) {
      this.setState({ player: { id: undefined, name: e.target.value, state: "None", flicker: false }})
    }
  
    playSound(state) {
      switch(state) {
        default:
          return null;
        case "Hate":
          return (<ReactAudioPlayer src={dislikeSoundEffect} autoPlay />);
        case "Love":
          return (<ReactAudioPlayer src={likeSoundEffect} autoPlay />);
      }
    }
  
    resetPlayers() {
        this.state.socket.emit("reset-players");

        this.setState({ player: { id: this.state.player.id, name: this.state.player.name, state: "None", flicker: false, host: this.state.player.host }})
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
            {this.playSound(player.state)} 
            <img className="unselectable state-img flicker" src={color} alt="state" />
            <h1 className="unselectable player-name">{player.name}</h1>
          </div>
        )
      }
  
      return (
        <div className="player-container" key={player.id}>
          <img className="unselectable state-img" src={color} alt="state" />
          <h1 className="unselectable player-name">{player.name}</h1>
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

    renderButtons() {
        if (this.state.spectating.params.ip !== undefined) 
        {
            return null;
        }

        return (          
        <div className="btn-container">
            <div className="btn btn-love unselectable" onClick={this.loveIt}><FontAwesomeIcon icon={faThumbsUp} className="btn-icon" /></div>
            <div className="btn btn-hate unselectable" onClick={this.hateIt}><FontAwesomeIcon icon={faThumbsDown} className="btn-icon" /></div>
        </div>
      )
    }
    
    render() {
      if (this.state.spectating !== undefined && this.state.socket === undefined) {
        return (
          <div className="App">
            <h1>Player Name:</h1>
            <input type="text" value={this.state.player.name} onChange={this.updateName} />
            <h1>Server IP:</h1>
            <input type="text" value={this.state.endpoint} onChange={this.updateEndpoint} />
            <button onClick={this.connectToServer}>Connect</button>
          </div>
        );
      }
  
      if (!this.state.connected && this.state.socket !== undefined) {
        this.updateSocket();
      }
  
      return (
        <div className="App">
          {this.renderPlayers()}
          {this.renderButtons()}
        </div>
      );
    }
  }