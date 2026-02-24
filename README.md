# DevLog (개발자를 위한 기술 블로그)

현대적인 웹 기술 스택인 **Next.js**와 **Supabase**를 활용하여 구축된 개인 블로그 및 게시물 공유 플랫폼입니다. 아이디 기반 인증, 닉네임 시스템, 댓글 및 북마크 기능을 갖춘 완성도 높은 블로그 서비스입니다.

🔗 **[Live Demo 보러가기](https://sooyeon-s-blog-platform.vercel.app/)**

## 🚀 기술 스택 (Tech Stack)

| 분류 | 기술 |
|------|------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router, Server/Client Components) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Backend / DB | [Supabase](https://supabase.com/) (PostgreSQL, Auth, RLS, Storage) |
| Deployment | [Vercel](https://vercel.com/) |
| Markdown | `react-markdown`, `remark-gfm`, `react-syntax-highlighter` |

## ✨ 주요 기능 (Key Features)

### 🔑 인증 시스템
- **아이디(ID) 기반 로그인**: 이메일 대신 설정한 고유 아이디와 비밀번호로 로그인
- **커스텀 회원가입**: 이름, 아이디(중복확인), 닉네임(중복확인), 비밀번호(확인 포함), 이메일 5단계 입력 폼
- **아이디 찾기**: 가입 이메일로 매직링크 발송 후 로그인 시 아이디 확인
- **비밀번호 찾기**: 이메일로 재설정 링크 발송 (30분 유효)

### ⚙️ 마이 페이지 & 계정 설정
- **계정 설정 페이지** (`/mypage/settings`): 비밀번호 재확인 보안 진입 보호
- 닉네임 변경 (중복확인 포함), 이메일 변경, 비밀번호 재설정, 회원 탈퇴
- **내가 쓴 글 / 북마크한 글 / 내가 쓴 댓글** 3탭으로 구성된 마이 페이지
- **내가 쓴 댓글**: 댓글을 작성한 게시글 제목 링크로 바로 이동, 인라인 수정, 단일·체크박스 다중·전체 선택 삭제

### 📝 게시글 기능
- **마크다운 에디터**: 코드 블록 구문 강조(Syntax Highlighting) 및 실시간 미리보기
- 발행 상태 관리: **임시저장 / 공개 / 비공개**
- 조회수(View Count) 측정, 읽기 소요 시간 자동 계산
- 인기순 정렬 필터

### 💬 댓글 시스템
- 게시글 하단에 고정 높이 스크롤 댓글 영역
- 댓글 작성 · 수정 · 삭제(본인 댓글만), **대댓글(답글)** 지원
- 작성자 닉네임, 작성일시 표시

### 🔖 기타 기능
- **북마크**: 게시글 상세 페이지 상단 아이콘으로 북마크 토글
- **URL 복사** 공유 기능
- **다크 모드 / 라이트 모드** 완벽 지원 (로컬 스토리지 저장)
- 게시글 수정 · 삭제 아이콘 (작성자에게만 표시)

## 📁 데이터베이스 스키마 (Supabase)

```
categories          – 카테고리
posts               – 게시글 (category_id FK)
profiles            – 사용자 프로필 (username, nickname, full_name)
bookmarks           – 북마크 (post_id, user_id)
comments            – 댓글 · 대댓글 (post_id, user_id, parent_id FK)
```

## 💻 로컬 개발 환경 설정 (Getting Started)

### 1. 레포지토리 클론
```bash
git clone https://github.com/MDA04systack/Sooyeon-s-blog-platform.git
cd blog-platform
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 환경 변수 설정
루트 디렉토리에 `.env.local` 파일을 생성하고 본인의 Supabase 프로젝트 정보를 입력합니다.
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`에 접속합니다.

## 🛠️ Supabase 마이그레이션 적용
```bash
npx supabase db push
```
`supabase/migrations/` 폴더의 SQL 파일들이 순차적으로 적용됩니다.

### 추가 대시보드 설정 (배포 시 필수)
1. **비밀번호 재설정 링크 유효기간**: Authentication → Providers → Email → `Email link expiration` 값을 `1800`(30분)으로 변경
2. **Secure email change 비활성화**: Authentication → Providers → Email → `Secure email change` 토글 **OFF** (새 이메일에서만 확인 링크 클릭)
3. **Site URL 등록**: Authentication → URL Configuration → `Site URL`에 Vercel 도메인 추가
4. **Redirect URLs 등록**: Authentication → URL Configuration → `Redirect URLs`에 아래 두 URL 추가
   ```
   https://<your-vercel-domain>/auth/callback
   http://localhost:3000/auth/callback
   ```
   > 비밀번호 재설정·아이디 찾기 이메일 링크가 정상 동작하려면 반드시 필요합니다.

## 🌐 배포 (Vercel)
1. Vercel에 GitHub 레포지토리 Import
2. Environment Variables에 `NEXT_PUBLIC_SUPABASE_URL` 및 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
3. Deploy 클릭
