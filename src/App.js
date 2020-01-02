import React from 'react';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import { Game } from "./app/game"

class App extends React.Component {
  render() {

    return (
      <div className="App">   
        <Router>
          <Switch>
            <Route exact path="/" component={Game} />
            <Route path="/spectator/:ip" component={Game} />
          </Switch>
        </Router>
      </div>
    )
  }
}

export default App;
