export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { predictionId } = req.body;

  const replicateApiToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateApiToken) {
    return res.status(500).json({ error: 'Replicate API token missing' });
  }

  if (!predictionId) {
    return res.status(400).json({ error: 'Missing predictionId' });
  }

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${replicateApiToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Replicate poll error:', data);
      return res.status(500).json({ error: 'Failed to check avatar status', replicateDetails: data });
    }

    res.status(200).json({ status: data.status, output: data.output });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error while checking status' });
  }
}
