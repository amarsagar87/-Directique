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
