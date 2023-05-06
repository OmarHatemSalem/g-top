import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// Redux Store Stuff
import { Provider } from 'react-redux';
import { store } from "./store";

import "./styles.css";

const root = ReactDOM.createRoot( document.getElementById( 'root' ) );


// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

root.render(

    <Provider store={ store }>
      <App />
    </Provider>
  
  );