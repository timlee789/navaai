# AiStudio7.com 배포 가이드

## 1. Supabase 설정

### 1.1 프로젝트 생성
1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 이름: `aistudio7-com`
3. 데이터베이스 비밀번호 설정 (강력한 비밀번호 사용)
4. 지역: `Northeast Asia (Seoul)` 선택

### 1.2 Storage 버킷 생성
1. Supabase 대시보드 → Storage
2. "New bucket" 클릭
3. 버킷 이름: `uploads`
4. Public bucket: ✅ 체크 (파일에 공개적으로 접근 가능하도록)
5. "Create bucket" 클릭

### 1.3 환경변수 가져오기
Supabase 대시보드 → Settings → API에서 다음 정보 복사:
- Project URL
- anon public key
- Database URL (Settings → Database → Connection string → URI)

## 2. 데이터베이스 마이그레이션

### 2.1 Prisma 설정
```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 데이터베이스 스키마 마이그레이션
npx prisma db push
```

### 2.2 관리자 계정 생성
```bash
# 스크립트 실행
node scripts/create-admin.js
```

## 3. Vercel 배포

### 3.1 GitHub 업로드
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 3.2 Vercel 설정
1. [vercel.com](https://vercel.com)에서 GitHub 계정으로 로그인
2. "Import Project" → GitHub 저장소 선택
3. 프로젝트 이름: `aistudio7-com`
4. Framework Preset: `Next.js` (자동 감지됨)
5. "Deploy" 클릭

### 3.3 환경변수 설정
Vercel 대시보드 → Settings → Environment Variables에 다음 추가:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-here
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 4. 초기 설정

### 4.1 첫 배포 후 확인사항
1. 데이터베이스 연결 테스트
2. 회원가입/로그인 기능 테스트
3. 파일 업로드 기능 테스트
4. 관리자 계정 로그인 테스트

### 4.2 추가 설정 (선택사항)

#### 커스텀 도메인 연결
1. Vercel 대시보드 → Domains
2. "Add Domain" → 도메인 입력
3. DNS 설정 지시사항 따르기

#### Stripe 결제 연동
1. [stripe.com](https://stripe.com)에서 계정 생성
2. API 키 받아서 환경변수에 추가

## 5. 문제 해결

### 자주 발생하는 문제들

1. **데이터베이스 연결 오류**
   - DATABASE_URL이 올바른지 확인
   - Supabase 프로젝트가 활성화되어 있는지 확인

2. **파일 업로드 실패**
   - Supabase Storage 버킷이 public으로 설정되어 있는지 확인
   - 환경변수 NEXT_PUBLIC_SUPABASE_* 확인

3. **빌드 에러**
   - `npx prisma generate` 실행
   - node_modules 삭제 후 `npm install`

## 6. 배포 완료 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] Storage 버킷 생성 완료
- [ ] 데이터베이스 마이그레이션 완료
- [ ] Vercel 배포 완료
- [ ] 환경변수 설정 완료
- [ ] 웹사이트 접속 확인
- [ ] 회원가입/로그인 테스트
- [ ] 파일 업로드 테스트
- [ ] 관리자 기능 테스트

배포 URL: `https://aistudio7-com.vercel.app` (또는 커스텀 도메인)