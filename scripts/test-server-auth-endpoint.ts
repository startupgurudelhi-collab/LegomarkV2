import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

async function runTest() {
  console.log('\n======================================================');
  console.log('TESTING COMPILED SERVER dist/server.cjs AUTH ROUTING');
  console.log('======================================================\n');

  // Spawn node dist/server.cjs on port 3099
  const serverProcess = spawn('node', ['dist/server.cjs'], {
    env: {
      ...process.env,
      PORT: '3099',
      NODE_ENV: 'production',
    },
    cwd: process.cwd(),
  });

  let serverStarted = false;

  serverProcess.stdout.on('data', (data) => {
    const text = data.toString();
    console.log('[SERVER STDOUT]:', text.trim());
    if (text.includes('listening on') || text.includes('3099')) {
      serverStarted = true;
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('[SERVER STDERR]:', data.toString().trim());
  });

  // Wait 2 seconds for server to boot
  await new Promise((r) => setTimeout(r, 2500));

  try {
    // Make POST /api/auth/login request
    console.log('\n--- Sending POST to http://127.0.0.1:3099/api/auth/login ---');
    const postData = JSON.stringify({
      email: 'nomaan@legomarkindia.com',
      password: 'TestPassword123!',
    });

    const options: http.RequestOptions = {
      hostname: '127.0.0.1',
      port: 3099,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const response = await new Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }>((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            body,
          });
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log('Response Status Code:', response.statusCode);
    console.log('Response Headers:', response.headers);
    console.log('Response Body:', response.body);

    if (response.statusCode === 405) {
      console.error('❌ FAILED: Received 405 Method Not Allowed');
      process.exit(1);
    } else {
      console.log(`✅ SUCCESS: Route exists and responded with status ${response.statusCode} (NOT 405)`);
    }

    // Also test GET /api/health
    const healthResponse = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
      http.get('http://127.0.0.1:3099/api/health', (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ statusCode: res.statusCode || 0, body }));
      }).on('error', reject);
    });

    console.log('Health Check Status:', healthResponse.statusCode, healthResponse.body);
  } finally {
    serverProcess.kill('SIGTERM');
  }
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
