import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Stream, View } from "./Page";
function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Stream />
        </Route>
        <Route exact path="/view">
          <View />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
