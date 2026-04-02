# Tohji — Complete Discography

77카드 / 70 아트워크 / Spotify + SoundCloud 자동 업데이트

## 배포 방법

### 1. GitHub에 올리기
```bash
git init
git add .
git commit -m "Tohji discography"
git remote add origin https://github.com/YOUR_USERNAME/tohji-discography.git
git push -u origin main
```

### 2. Vercel 연결
- [vercel.com](https://vercel.com)에서 GitHub repo import

### 3. Spotify Developer 설정 (무료, 사업자 불필요)
1. [developer.spotify.com](https://developer.spotify.com) 접속 → Spotify 계정으로 로그인
2. Dashboard → **Create App**
   - App name: `Tohji Disco`
   - Redirect URI: `http://localhost:3000` (아무거나 OK)
   - APIs: `Web API` 체크
3. **Client ID**와 **Client Secret** 복사

### 4. Vercel 환경변수 설정
Vercel 프로젝트 → Settings → Environment Variables:
```
SPOTIFY_CLIENT_ID = (위에서 복사한 Client ID)
SPOTIFY_CLIENT_SECRET = (위에서 복사한 Client Secret)
```

### 5. 사용
- 사이트 우하단 🔄 버튼 클릭
- **신곡 확인** 버튼 → Spotify + SoundCloud 자동 체크
- 기존 데이터와 비교해서 새 곡만 표시

## 프로젝트 구조
```
public/
  index.html    ← 메인 디스코그래피 페이지 (77카드)
api/
  update.js     ← Spotify API + SoundCloud 체크 서버리스 함수
vercel.json     ← 라우팅 설정
package.json
```

## 수동으로 곡 추가하기
`public/index.html`의 `const D=[...]` 배열에 카드 추가:
```js
{tg:"싱글",tc:"sg",a:"artworkKey",t:"곡 제목",m:"2026.XX.XX",d:"설명",tr:[{n:"1",v:"트랙명"}]}
```
아트워크는 `const A={...}`에 추가:
```js
"artworkKey":"https://i.scdn.co/image/ab67616d0000b273{24자리해시}"
```
