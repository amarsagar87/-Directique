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
        version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc", // SDXL
        input: {
          prompt,
          width: 512,
          height: 768,
          num_outputs: 1
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Replicate API error:', result);  // Log full error
      return res.status(500).json({ error: 'Failed to start avatar generation', raw: result });
    }

    res.status(200).json({ status: result.status, prediction: result });
  } catch (error) {
    console.error('Server error:', error);  // Log unexpected error
    res.status(500).json({ error: 'Server error while generating avatar', raw: error.message });
  }
}
