import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from "react-redux";
import { store, } from './Components/store';
import App from './App.tsx'
import './index.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
import "bootstrap-icons/font/bootstrap-icons.css";




ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* <PersistGate loading={null} persistor={persistStore(store)}> */}
        <App />
      {/* </PersistGate> */}
    </Provider>
  </React.StrictMode>
);