const https = require('https');

const REMOTE_SERVER = 'https://my-bose-bridge-16056d12d248.herokuapp.com';

function httpsRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        }).on('error', reject);
    });
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const ALEXA_ID = process.env.ALEXA_ID;
    
    if (!ALEXA_ID) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'ALEXA_ID not configured' })
        };
    }

    const path = event.path.replace('/.netlify/functions/bose', '');
    const action = event.queryStringParameters?.action;

    try {
        // Get state
        if (event.httpMethod === 'GET' && (!action || action === 'state')) {
            const filter = encodeURIComponent(JSON.stringify({ where: { alexaID: ALEXA_ID } }));
            const result = await httpsRequest(`${REMOTE_SERVER}/api/homes/findOne?filter=${filter}`);
            return {
                statusCode: 200,
                headers,
                body: result.body
            };
        }

        // Send command
        if (event.httpMethod === 'POST' || action === 'command') {
            const command = event.queryStringParameters?.cmd || '';
            const speakerName = event.queryStringParameters?.speaker || 'Bose';
            
            if (!command) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing command parameter' })
                };
            }

            const url = `${REMOTE_SERVER}/api/homes/pushKey?bridgeID=${encodeURIComponent(ALEXA_ID)}&url=/${encodeURIComponent(speakerName)}${command}`;
            const result = await httpsRequest(url);
            
            return {
                statusCode: 200,
                headers,
                body: result.body
            };
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid request' })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
