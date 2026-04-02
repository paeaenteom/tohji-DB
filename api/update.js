// Tohji Discography Auto-Update API
// Vercel Serverless Function
// Env vars needed: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET

const TOHJI_SPOTIFY_ID = '7j7kL8K4GE1z5Cdxl7ucBF';
const TOHJI_SC_URL = 'https://soundcloud.com/11_tohji_11';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const results = { spotify: [], soundcloud: [], error: null };

  // ── SPOTIFY ──
  try {
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      results.error = 'Vercel 환경변수에 SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET을 설정해주세요';
      return res.status(200).json(results);
    }

    // Client Credentials Flow
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      results.error = 'Spotify 인증 실패: ' + (tokenData.error_description || 'unknown');
      return res.status(200).json(results);
    }
    const token = tokenData.access_token;
    const headers = { 'Authorization': 'Bearer ' + token };

    // Fetch all album types: album, single, appears_on, compilation
    const types = ['album,single', 'appears_on'];
    for (const type of types) {
      let url = `https://api.spotify.com/v1/artists/${TOHJI_SPOTIFY_ID}/albums?include_groups=${type}&market=JP&limit=50`;
      while (url) {
        const r = await fetch(url, { headers });
        const d = await r.json();
        if (d.items) {
          d.items.forEach(item => {
            const art = item.images?.[0]?.url || '';
            // Extract hash from CDN URL
            const hashMatch = art.match(/ab67616d0000b273([a-f0-9]+)/);
            results.spotify.push({
              name: item.name,
              artists: item.artists?.map(a => a.name).join(', ') || 'Tohji',
              date: item.release_date || '',
              type: item.album_type || type,
              artwork: art,
              artwork_hash: hashMatch ? hashMatch[1] : '',
              spotify_id: item.id,
              total_tracks: item.total_tracks
            });
          });
        }
        url = d.next || null;
      }
    }

    // Also check Mall Boyz
    const mallBoyzId = '4frHeZ2ummtLwkuV7QohYp';
    const mbUrl = `https://api.spotify.com/v1/artists/${mallBoyzId}/albums?include_groups=album,single&market=JP&limit=50`;
    const mbRes = await fetch(mbUrl, { headers });
    const mbData = await mbRes.json();
    if (mbData.items) {
      mbData.items.forEach(item => {
        const art = item.images?.[0]?.url || '';
        const hashMatch = art.match(/ab67616d0000b273([a-f0-9]+)/);
        results.spotify.push({
          name: item.name,
          artists: 'Mall Boyz',
          date: item.release_date || '',
          type: 'mb',
          artwork: art,
          artwork_hash: hashMatch ? hashMatch[1] : '',
          spotify_id: item.id,
          total_tracks: item.total_tracks
        });
      });
    }
  } catch (e) {
    results.error = 'Spotify 오류: ' + e.message;
  }

  // ── SOUNDCLOUD ──
  try {
    // Fetch Tohji's SC page HTML and extract track info
    const scRes = await fetch(TOHJI_SC_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TohjiDisco/1.0)' }
    });
    if (scRes.ok) {
      const html = await scRes.text();
      // Extract track titles from the HTML meta/noscript content
      const titleMatches = [...html.matchAll(/<h2[^>]*itemprop="name"[^>]*><a[^>]*>([^<]+)<\/a>/g)];
      const dateMatches = [...html.matchAll(/<time[^>]*datetime="([^"]+)"[^>]*>/g)];
      
      // Also try JSON-LD or structured data
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      
      if (titleMatches.length) {
        titleMatches.forEach((m, i) => {
          results.soundcloud.push({
            name: m[1].trim(),
            date: dateMatches[i] ? dateMatches[i][1].substring(0, 10) : '',
            artwork: ''
          });
        });
      }

      // Fallback: extract from noscript section
      if (!results.soundcloud.length) {
        const noscriptTracks = [...html.matchAll(/<article[^>]*>[\s\S]*?<a[^>]*href="\/11_tohji_11\/([^"]+)"[^>]*>[\s\S]*?<\/article>/g)];
        noscriptTracks.forEach(m => {
          const slug = m[1].replace(/-/g, ' ');
          results.soundcloud.push({ name: slug, date: '', artwork: '' });
        });
      }
    }
  } catch (e) {
    // SoundCloud fetch failure is non-critical
    console.log('SoundCloud fetch error:', e.message);
  }

  return res.status(200).json(results);
}
