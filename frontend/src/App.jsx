import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GenerateScript from './pages/GenerateScript';
import ScriptEditor from './pages/ScriptEditor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
    
      </Routes>
    </Router>
  );
}

export default App;
