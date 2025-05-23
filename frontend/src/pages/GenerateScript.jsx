import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GenerateScript = () => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!title.trim() || !genre.trim() || !idea.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://directique-backend.onrender.com/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, genre, idea })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.detail || 'API returned an error');
      }

      const data = await response.json();
      setLoading(false);

      if (data.script) {
        localStorage.setItem('generatedScript', data.script);
        navigate('/editor');
      } else {
        alert('Script not received. Try again.');
      }
    } catch (error) {
      setLoading(false);
      alert('Error generating script: ' + error.message);
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Generate a Script</h2>
      <input
        className="w-full p-2 border mb-4"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="w-full p-2 border mb-4"
        placeholder="Genre"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
      />
      <textarea
        className="w-full p-2 border mb-4"
        placeholder="Story Idea"
        rows={5}
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
      />
      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Script'}
      </button>
    </div>
  );
};

export default GenerateScript;
