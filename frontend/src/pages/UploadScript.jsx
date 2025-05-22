import React, { useState } from 'react';

const UploadScript = () => {
  const [scriptText, setScriptText] = useState('');
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState({});
  const [avatarUrls, setAvatarUrls] = useState({});
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Unknown error');
      }

      setCharacters(result.characters);
    } catch (err) {
      setError(err.message || "An error occurred.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterChange = (index, field, value) => {
    const updated = [...characters];
    updated[index][field] = value;
    setCharacters(updated);
  };

  const generateAvatar = async (char, index) => {
    setAvatarLoading((prev) => ({ ...prev, [index]: true }));
    setError('');

    try {
      const initRes = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(char)
      });

      const initData = await initRes.json();

      if (!initRes.ok || !initData.prediction?.id) {
        throw new Error(initData.error || "Failed to start avatar generation");
      }

      const predictionId = initData.prediction.id;

      const pollForAvatar = async () => {
        const statusRes = await fetch('/api/get-avatar-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ predictionId })
        });

        const statusData = await statusRes.json();

        if (statusData.status === 'succeeded' && statusData.output?.length > 0) {
          setAvatarUrls((prev) => ({ ...prev, [index]: statusData.output[0] }));
          setAvatarLoading((prev) => ({ ...prev, [index]: false }));
        } else if (statusData.status === 'failed') {
          throw new Error("Avatar generation failed");
        } else {
          setTimeout(pollForAvatar, 3000);
        }
      };

      pollForAvatar();

    } catch (err) {
      setError(err.message || "Failed to generate avatar");
      console.error(err);
      setAvatarLoading((prev) => ({ ...prev, [index]: false }));
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
            <div key={index} className="border rounded p-4 mb-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Emotion</label>
                <input
                  type="text"
                  placeholder="e.g. happy, angry"
                  value={char.emotion || ''}
                  onChange={(e) => handleCharacterChange(index, 'emotion', e.target.value)}
                  className="w-full border rounded p-2 mb-2"
                />
                <button
                  onClick={() => generateAvatar(char, index)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  disabled={avatarLoading[index]}
                >
                  {avatarLoading[index] ? "Generating Avatar..." : "Generate Avatar"}
                </button>
              </div>

              {avatarUrls[index] && (
                <div className="mt-4">
                  <img src={avatarUrls[index]} alt="Avatar" className="rounded shadow w-64" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadScript;
