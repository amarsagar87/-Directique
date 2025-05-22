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
    const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc", // SDXL Stable
        input: {
          prompt,
          width: 512,
          height: 768,
          num_outputs: 1
        }
      }),
    });

    const prediction = await predictionResponse.json();

    if (!prediction.urls || !prediction.urls.get) {
      console.error('Error getting prediction:', prediction);
      return res.status(500).json({ error: 'Failed to start avatar generation' });
    }

    // Polling for completion
    let avatarUrl = null;
    for (let i = 0; i < 15; i++) {
      const pollRes = await fetch(prediction.urls.get, {
        headers: {
          'Authorization': `Token ${replicateApiToken}`,
        },
      });

      const pollData = await pollRes.json();

      if (pollData.status === 'succeeded' && pollData.output?.length > 0) {
        avatarUrl = pollData.output[0];
        break;
      } else if (pollData.status === 'failed') {
        return res.status(500).json({ error: 'Avatar generation failed' });
      }

      // Wait for 2 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!avatarUrl) {
      return res.status(500).json({ error: 'Avatar generation timed out' });
    }

    return res.status(200).json({ avatar_url: avatarUrl });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error while generating avatar' });
  }
}
