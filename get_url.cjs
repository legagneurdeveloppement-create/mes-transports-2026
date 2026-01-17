const { spawn } = require('child_process');
const tunnel = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', 'http://localhost:5173']);

tunnel.stderr.on('data', (data) => {
    const output = data.toString();
    const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
        console.log('URL_FOUND:' + match[0]);
    }
});

tunnel.on('close', (code) => {
    console.log(`Tunnel closed with code ${code}`);
});
