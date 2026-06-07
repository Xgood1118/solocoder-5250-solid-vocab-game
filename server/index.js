import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8202;
const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading data file:', e);
  }
  return { player: null, wrongWords: [], lastSync: 0 };
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing data file:', e);
    return false;
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function mergePlayer(local, remote) {
  if (!local) return remote;
  if (!remote) return local;
  
  if ((local.updatedAt || 0) >= (remote.updatedAt || 0)) {
    return local;
  }
  return remote;
}

function mergeWrongWords(local, remote) {
  const map = new Map();
  
  for (const word of (local || [])) {
    map.set(word.id, word);
  }
  
  for (const word of (remote || [])) {
    const existing = map.get(word.id);
    if (!existing || (word.lastWrong || 0) > (existing.lastWrong || 0)) {
      map.set(word.id, word);
    }
  }
  
  return Array.from(map.values());
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/api/sync' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const serverData = readData();
      
      const mergedPlayer = mergePlayer(body.player, serverData.player);
      const mergedWrongWords = mergeWrongWords(body.wrongWords, serverData.wrongWords);
      
      const newData = {
        player: mergedPlayer,
        wrongWords: mergedWrongWords,
        lastSync: Date.now()
      };
      
      writeData(newData);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        player: mergedPlayer,
        wrongWords: mergedWrongWords,
        serverTime: Date.now()
      }));
    } catch (e) {
      console.error('Sync error:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }
  
  if (req.url === '/api/status' && req.method === 'GET') {
    const data = readData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      hasData: !!data.player,
      lastSync: data.lastSync
    }));
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Sync server running on http://localhost:${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
