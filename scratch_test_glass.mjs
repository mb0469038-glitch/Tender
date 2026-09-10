import http from 'http';

http.get('http://213.199.37.145/api/workspace', (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    try {
      console.log('Got response, bytes:', raw.length);
      const parsed = JSON.parse(raw);
      const snapshot = typeof parsed.snapshot === 'string' ? JSON.parse(parsed.snapshot) : parsed.snapshot;
      console.log('Snapshot keys:', Object.keys(snapshot));
      console.log('Materials total in snapshot:', snapshot.materials?.length);
      
      const glass = (snapshot.materials || []).filter(m => m.databaseId === 'glass');
      console.log('Glass items count:', glass.length);
      console.log('Glass items:', glass.map(g => ({ id: g.id, name: g.name, code: g.code, databaseId: g.databaseId, cost: g.cost })));

      const dbCounts = {};
      (snapshot.materials || []).forEach(m => {
        dbCounts[m.databaseId] = (dbCounts[m.databaseId] || 0) + 1;
      });
      console.log('Materials by databaseId:', dbCounts);
    } catch (e) {
      console.error('Error parsing:', e);
    }
  });
}).on('error', console.error);
