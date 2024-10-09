import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './context/UserContext'; // Import UserProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <UserProvider>  {/* Wrap the app with UserProvider */}
                <App />
            </UserProvider>
        </BrowserRouter>
    </React.StrictMode>
);

reportWebVitals();