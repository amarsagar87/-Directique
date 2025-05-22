export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, age, appearance, personality, emotion } = req.body;

  const replicateApiToken = process.env.REPLICATE_API_TOKEN;

  if (!replicateApiToken) {
    return res.status(500).json({ error: 'Missing Replicate API token' });
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
        version: "aa1e7c60c7df0c74b1aa0b3c1e0aa80e3c7f564c76c1d024d3c24e4a0e1a9c3a", // SDXL
        input: {
          prompt,
          width: 512,
          height: 768,
          scheduler: "K_EULER",  // recommended by the model
          num_inference_steps: 30
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API ERROR:', errorText);
      return res.status(500).json({ error: 'Failed to generate avatar' });
    }

    const data = await response.json();
    const avatarUrl = data?.urls?.get;

    return res.status(200).json({ avatar_url: avatarUrl });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Server error while generating avatar' });
  }
}
