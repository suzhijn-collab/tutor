export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const DOUBAO_API_KEY = 'ark-ecf9c33a-d1b3-4592-ab71-1b5b76e934cc-90d0d';
  const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/responses';

  try {
    const response = await fetch(DOUBAO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DOUBAO_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(response.status).send(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to call Doubao API' });
  }
}
