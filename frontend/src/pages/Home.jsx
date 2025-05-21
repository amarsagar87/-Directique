import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Directique</h1>
        <p className="mb-6">Turn your ideas into professional TV/film scripts with AI</p>
        <div className="flex justify-center gap-4">
          <Link to="/generate" className="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800">
            Start New Project
          </Link>
          <Link to="/upload" className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700">
            Upload Script & Generate Characters
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
