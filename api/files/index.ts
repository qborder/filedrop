
import { NextApiRequest, NextApiResponse } from 'next';
import { getMetadataList } from '../_lib/metadataUtils'; // Adjusted path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const files = await getMetadataList();
    // The list is already newest first from addMetadataEntry
    return res.status(200).json(files);
  } catch (error: any) {
    console.error('Error fetching file list:', error);
    return res.status(500).json({ message: error.message || 'Failed to retrieve file list.' });
  }
}
