export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { name, age, appearance, personality, emotion } = req.body;

  const replicateApiToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateApiToken) {
    return res.status(500).json({ error: 'Replicate API token missing' });
  }

  const prompt = `portrait of ${name}, age ${age}, ${appearance}, personality: ${personality}, facial expression: ${emotion}, ultra-detailed, cinematic lighting, studio background`;

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc", // Stable Diffusion XL
        input: {
          prompt,
          width: 512,
          height: 768,
          num_outputs: 1
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Replicate error details:", data);
      return res.status(500).json({ error: 'Failed to start avatar generation', replicateDetails: data });
    }

    // Send prediction ID so frontend can poll
    res.status(200).json({
      status: data.status,
      id: data.id,
      url: data.urls?.get || null,
      prediction: data
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: 'Server error while generating avatar' });
  }
}
