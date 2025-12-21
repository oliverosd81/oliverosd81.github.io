const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    const action = event.queryStringParameters?.action;

    try {
        // Add track to queue
        if (action === 'add' && event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const { trackUri, trackName, trackArtist, trackImage, addedBy } = body;

            if (!trackUri || !trackName || !addedBy) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing required fields' })
                };
            }

            await sql`
                INSERT INTO queue_entries (track_uri, track_name, track_artist, track_image, added_by)
                VALUES (${trackUri}, ${trackName}, ${trackArtist || ''}, ${trackImage || ''}, ${addedBy})
            `;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true })
            };
        }

        // Get who added a track
        if (action === 'get-added-by') {
            const trackUri = event.queryStringParameters?.trackUri;

            if (!trackUri) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing trackUri' })
                };
            }

            const result = await sql`
                SELECT added_by, added_at 
                FROM queue_entries 
                WHERE track_uri = ${trackUri}
                ORDER BY added_at DESC
                LIMIT 1
            `;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result[0] || null)
            };
        }

        // Get all recent entries (for batch lookup)
        if (action === 'get-recent') {
            const result = await sql`
                SELECT track_uri, added_by, added_at 
                FROM queue_entries 
                WHERE added_at > NOW() - INTERVAL '24 hours'
                ORDER BY added_at DESC
            `;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result)
            };
        }

        // Clean old entries (older than 24h)
        if (action === 'cleanup') {
            const result = await sql`
                DELETE FROM queue_entries 
                WHERE added_at < NOW() - INTERVAL '24 hours'
                RETURNING id
            `;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ deleted: result.length })
            };
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid action' })
        };

    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
