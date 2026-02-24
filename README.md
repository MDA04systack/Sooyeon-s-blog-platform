# DevLog (개발자를 위한 기술 블로그)

현대적인 웹 기술 스택인 **Next.js**와 **Supabase**를 활용하여 구축된 개인 블로그 및 게시물 공유 플랫폼입니다. 깔끔한 UI와 풍부한 텍스트 에디터, 다크 모드, 북마크 기능을 제공합니다.

🔗 **[Live Demo 보러가기](https://sooyeon-s-blog-platform.vercel.app/)**

![DevLog Home](https://sooyeon-s-blog-platform.vercel.app/og-image.png) <!-- 스크린샷 썸네일 경로가 있다면 교체해주세요 -->

## 🚀 기술 스택 (Tech Stack)

* **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server/Client Components)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, RLS Policies)
* **Deployment**: [Vercel](https://vercel.com/)
* **Markdown Processor**: `react-markdown`, `remark-gfm`, `react-syntax-highlighter`

## ✨ 주요 기능 (Key Features)

1. **사용자 인증 (Authentication)**
   * Supabase Auth를 활용한 안전한 이메일 회원가입 및 로그인 시스템
2. **풀스택 마크다운 에디터 (Markdown Editor)**
   * 코딩 블록구문 강조(Syntax Highlighting) 및 실시간 미리보기가 지원되는 에디터
   * 글 발행 상태 관리: **임시저장(Draft) / 공개(Published) / 비공개(Private)** 기능
3. **블로그 읽기 경험 최적화**
   * **다크 모드 / 라이트 모드** 완벽 지원 (테마 전환 및 로컬 스토리지 저장)
   * 조회수(View Count) 측정 및 인기순 정렬 필터 기능
   * 각 페이지별 읽기 소요 시간(Read Time) 자동 계산 기능
4. **마이 페이지 & 북마크 (My Page & Bookmarks)**
   * 본인이 작성한 글과 북마크한 글을 탭으로 분리하여 관리
   * 게시물 상세 페이지에서 직접 '북마크 토글' 및 빠르고 쉬운 'URL 클립보드 복사(공유)' 기능
   * 본인 작성 글에 대한 인라인 수정(Edit) 및 삭제(Delete) 아이콘 제공

## 💻 로컬 개발 환경 설정 (Getting Started)

프로젝트를 로컬 환경에서 실행하려면 다음 단계를 따르세요.

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
루트 디렉토리에 `.env.local` 파일을 생성하고, 본인의 Supabase 프로젝트 정보를 입력합니다.
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
