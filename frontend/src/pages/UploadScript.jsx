import React, { useState } from 'react';

const UploadScript = () => {
  const [scriptText, setScriptText] = useState('');
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!scriptText.trim()) {
      alert("Please paste your script.");
      return;
    }

    setLoading(true);
    setError('');
    setCharacters([]);

    try {
      const response = await fetch('https://directique-backend.onrender.com/upload-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: scriptText })
      });

      const data = await response.json();
      setLoading(false);

      try {
        const parsedCharacters = JSON.parse(data.characters).map((char) => ({
          ...char,
          avatar: '', // placeholder for avatar image
          avatarLoading: false,
        }));
        setCharacters(parsedCharacters);
      } catch (err) {
        setError("Failed to parse character data. Try a simpler script.");
        console.error("JSON Parse Error:", err);
      }
    } catch (err) {
      setLoading(false);
      setError("Error generating characters. Please try again.");
      console.error(err);
    }
  };

  const handleCharacterChange = (index, field, value) => {
    const updated = [...characters];
    updated[index][field] = value;
    setCharacters(updated);
  };

  const generateAvatar = async (index) => {
    const character = characters[index];
    const prompt = `Portrait of a character: ${character.appearance}. Personality: ${character.personality}`;

    const updated = [...characters];
    updated[index].avatarLoading = true;
    setCharacters(updated);

    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_KEY || 'sk-xxx'}` // Replace with secure env setup
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "512x512"
        })
      });

      const result = await response.json();
      updated[index].avatar = result.data[0].url;
    } catch (err) {
      console.error("Avatar generation failed:", err);
      updated[index].avatar = '';
    } finally {
      updated[index].avatarLoading = false;
      setCharacters([...updated]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Upload or Paste Script</h2>
      <textarea
        className="w-full h-60 p-4 border rounded mb-4"
        placeholder="Paste your movie or TV script here..."
        value={scriptText}
        onChange={(e) => setScriptText(e.target.value)}
      />
      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
      >
        {loading ? "Analyzing Script..." : "Generate Characters"}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {characters.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Generated Characters</h3>
          {characters.map((char, index) => (
            <div key={index} className="border rounded p-4 mb-6 bg-gray-50">
              {char.avatar && (
                <img
                  src={char.avatar}
                  alt={`${char.name} avatar`}
                  className="w-32 h-32 rounded-full mb-4 object-cover border"
                />
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                {["name", "age", "role", "personality", "appearance", "voice_style"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1 capitalize">{field.replace('_', ' ')}</label>
                    <input
                      type="text"
                      value={char[field]}
                      onChange={(e) => handleCharacterChange(index, field, e.target.value)}
                      className="w-full border rounded p-2"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => generateAvatar(index)}
                disabled={char.avatarLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {char.avatarLoading ? "Generating Avatar..." : "Generate Avatar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadScript;
