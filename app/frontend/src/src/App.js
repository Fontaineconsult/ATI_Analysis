import React, { useContext } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import About from './components/About';
import Dashboard from './components/Dashboard';
import { UserContext } from './context/UserContext'; // Import UserContext

function App() {
    const { user } = useContext(UserContext); // Access context (just as a placeholder)

    return (
        <div className="App">
            <header className="App-header">
                <nav>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/about">About</Link></li>
                        <li><Link to="/dashboard">Dashboard</Link></li>
                    </ul>
                </nav>

                {/* Placeholder for user logic (can be implemented later) */}
                <div>
                    {user ? (
                        <p>Welcome, {user.name}</p>
                    ) : (
                        <p>User is not logged in</p>
                    )}
                </div>

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </header>
        </div>
    );
}

export default App;