const https = require('https');

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'https://danidev.eu/bose/';

function httpsRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const action = event.queryStringParameters?.action;

    try {
        // Get authorization URL
        if (action === 'auth-url') {
            const scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming';
            const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}`;
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ url: authUrl })
            };
        }

        // Exchange code for tokens
        if (action === 'token') {
            const code = event.queryStringParameters?.code;
            if (!code) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code' }) };
            }

            const postData = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: SPOTIFY_REDIRECT_URI
            }).toString();

            const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

            const result = await httpsRequest({
                hostname: 'accounts.spotify.com',
                path: '/api/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, postData);

            return { statusCode: 200, headers, body: result.body };
        }

        // Refresh token
        if (action === 'refresh') {
            const refreshToken = event.queryStringParameters?.refresh_token;
            if (!refreshToken) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing refresh_token' }) };
            }

            const postData = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }).toString();

            const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

            const result = await httpsRequest({
                hostname: 'accounts.spotify.com',
                path: '/api/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, postData);

            return { statusCode: 200, headers, body: result.body };
        }

        // Search tracks
        if (action === 'search') {
            const query = event.queryStringParameters?.q;
            const accessToken = event.headers.authorization?.replace('Bearer ', '');
            
            if (!query || !accessToken) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing query or token' }) };
            }

            const result = await httpsRequest({
                hostname: 'api.spotify.com',
                path: `/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            return { statusCode: 200, headers, body: result.body };
        }

        // Add to queue
        if (action === 'queue') {
            const uri = event.queryStringParameters?.uri;
            const accessToken = event.headers.authorization?.replace('Bearer ', '');
            
            if (!uri || !accessToken) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing uri or token' }) };
            }

            const result = await httpsRequest({
                hostname: 'api.spotify.com',
                path: `/v1/me/player/queue?uri=${encodeURIComponent(uri)}`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Length': 0
                }
            });

            if (result.statusCode === 204 || result.statusCode === 200) {
                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            } else {
                return { statusCode: result.statusCode, headers, body: result.body };
            }
        }

        // Get current playback
        if (action === 'playback') {
            const accessToken = event.headers.authorization?.replace('Bearer ', '');
            
            if (!accessToken) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing token' }) };
            }

            const result = await httpsRequest({
                hostname: 'api.spotify.com',
                path: '/v1/me/player',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            return { statusCode: 200, headers, body: result.body || '{}' };
        }

        // Get queue
        if (action === 'get-queue') {
            const accessToken = event.headers.authorization?.replace('Bearer ', '');
            
            if (!accessToken) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing token' }) };
            }

            const result = await httpsRequest({
                hostname: 'api.spotify.com',
                path: '/v1/me/player/queue',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            return { statusCode: 200, headers, body: result.body || '{}' };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};