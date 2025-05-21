const handleGenerate = async () => {
  if (!title || !genre || !idea) {
    alert("Please fill in all fields.");
    return;
  }

  setLoading(true);

  const response = await fetch('https://directique-backend.onrender.com/generate-script', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, genre, idea })
  });

  const data = await response.json();
  setLoading(false);

  if (data.script) {
    localStorage.setItem('generatedScript', data.script);
    navigate('/editor');
  } else {
    alert('Error generating script');
  }
};
