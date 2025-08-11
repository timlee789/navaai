# Google OAuth 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성 또는 선택
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

### 1.2 OAuth 2.0 API 활성화
1. API 및 서비스 > 라이브러리로 이동
2. "Google+ API" 검색 후 활성화

### 1.3 OAuth 2.0 클라이언트 ID 생성
1. API 및 서비스 > 사용자 인증 정보로 이동
2. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
3. 애플리케이션 유형: "웹 애플리케이션" 선택
4. 다음 정보 입력:
   - **이름**: NavaAI Studio Web Client
   - **승인된 자바스크립트 원본**: 
     - `http://localhost:3001` (개발환경)
     - `https://yourdomain.com` (프로덕션)
   - **승인된 리디렉션 URI**:
     - `http://localhost:3001/api/auth/google` (개발환경)
     - `https://yourdomain.com/api/auth/google` (프로덕션)

### 1.4 클라이언트 ID 및 보안 비밀번호 복사
- 클라이언트 ID와 클라이언트 보안 비밀번호를 안전한 곳에 저장

## 2. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret-here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-google-client-id-here
```

**주의**: 실제 Google Client ID와 Secret을 입력해야 합니다.

## 3. 패스워드 리셋 이메일 설정 (선택사항)

Gmail을 사용하여 패스워드 리셋 이메일을 보내려면:

### 3.1 Gmail 앱 비밀번호 생성
1. Google 계정 설정에서 2단계 인증 활성화
2. 앱 비밀번호 생성 (16자리 코드)

### 3.2 환경 변수 추가
```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
```

## 4. 기능 테스트

### 4.1 Google 로그인 테스트
1. 개발 서버 실행: `npm run dev`
2. `/login` 페이지 접속
3. "Sign in with Google" 버튼 클릭
4. Google 계정으로 로그인

### 4.2 패스워드 리셋 테스트
1. `/forgot-password` 페이지 접속
2. 이메일 주소 입력 후 리셋 링크 요청
3. 이메일에서 리셋 링크 클릭
4. 새 비밀번호 설정

## 5. 현재 구현된 기능

✅ **완료된 기능들:**
- Google OAuth 로그인/회원가입
- 패스워드 복구 (이메일 링크)
- 패스워드 리셋 페이지
- 사용자 계정 자동 생성 (Google 로그인 시)
- JWT 토큰 기반 인증
- 데이터베이스 연동 (Google ID 저장)

✅ **API 엔드포인트:**
- `POST /api/auth/google` - Google OAuth 처리
- `POST /api/auth/forgot-password` - 패스워드 리셋 요청
- `POST /api/auth/verify-reset-token` - 리셋 토큰 검증
- `POST /api/auth/reset-password` - 패스워드 업데이트

✅ **페이지:**
- `/login` - 기본 로그인 + Google 로그인
- `/register` - 기본 회원가입 + Google 회원가입
- `/forgot-password` - 패스워드 리셋 요청
- `/reset-password` - 새 패스워드 설정

## 6. 보안 고려사항

- Google Client ID는 공개되어도 안전합니다
- Client Secret은 서버 측에서만 사용되며 절대 노출되지 않습니다
- JWT 토큰은 HTTP-only 쿠키로 저장됩니다
- 패스워드 리셋 토큰은 1시간 후 만료됩니다
- 모든 비밀번호는 bcrypt로 해시화되어 저장됩니다

## 7. 문제 해결

### Google 로그인이 작동하지 않는 경우:
1. Google Client ID가 올바르게 설정되었는지 확인
2. 브라우저 개발자 도구에서 JavaScript 에러 확인
3. 네트워크 탭에서 API 호출 상태 확인

### 이메일이 발송되지 않는 경우:
1. Gmail 앱 비밀번호가 올바른지 확인
2. 2단계 인증이 활성화되었는지 확인
3. 서버 로그에서 이메일 발송 에러 확인