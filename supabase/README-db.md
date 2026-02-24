# Supabase 마이그레이션 실행 방법

## 사전 준비

### Supabase CLI 설치
```bash
npm install -g supabase
```

## 마이그레이션 실행 방법

### 방법 1: Supabase Dashboard (가장 간단)
1. [app.supabase.com](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **SQL Editor** 탭으로 이동
4. `supabase/migrations/001_initial_schema.sql` 파일 내용 붙여넣기 후 실행
5. 이어서 `supabase/seed.sql` 파일 내용 붙여넣기 후 실행

### 방법 2: Supabase CLI (로컬 개발 환경)
```bash
# 1. Supabase CLI로 로그인
npx supabase login

# 2. 프로젝트 연결 (프로젝트 ref는 Supabase Dashboard > Settings > General에서 확인)
npx supabase link --project-ref <your-project-ref>

# 3. 마이그레이션 실행
npx supabase db push

# 4. (선택) 시드 데이터 실행
npx supabase db execute --file supabase/seed.sql
```

### 방법 3: psql 직접 연결
```bash
# Supabase Dashboard > Settings > Database > Connection string (URI) 복사 후:
psql "<connection-string>" -f supabase/migrations/001_initial_schema.sql
psql "<connection-string>" -f supabase/seed.sql
```

## 파일 구조

```
supabase/
├── migrations/
│   └── 001_initial_schema.sql   # posts 테이블 + RLS 정책 생성
└── seed.sql                     # 샘플 블로그 게시글 데이터
```

## Posts 테이블 구조

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 기본키 |
| title | TEXT | 게시글 제목 |
| slug | TEXT | URL용 슬러그 (고유) |
| excerpt | TEXT | 요약 |
| content | TEXT | 본문 (Markdown) |
| category | TEXT | 카테고리 (프론트엔드, 백엔드, DevOps, 커리어, AI, 보안, 툴링) |
| thumbnail_url | TEXT | 썸네일 이미지 URL |
| author_name | TEXT | 작성자 이름 |
| author_avatar_url | TEXT | 작성자 아바타 URL |
| published_at | TIMESTAMPTZ | 게시일 |
| is_featured | BOOLEAN | 히어로 섹션 featured 여부 |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

## RLS 정책

| 정책 | 대상 | 조건 |
|------|------|------|
| posts_public_read | 누구나 | SELECT 허용 |
| posts_auth_insert | 인증 유저 | INSERT 허용 |
| posts_auth_update | 인증 유저 | UPDATE 허용 |
| posts_auth_delete | 인증 유저 | DELETE 허용 |
