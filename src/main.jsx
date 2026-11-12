import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { HelpProvider } from './components/help.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelpProvider>
      <App />
    </HelpProvider>
  </React.StrictMode>,
)