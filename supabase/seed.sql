-- DevLog Blog Platform - Seed Data
-- Paste into Supabase Dashboard > SQL Editor

-- 기존 데이터 초기화 (순서 중요: posts부터 지워야 foreign key 충돌 방지)
DELETE FROM public.posts;
DELETE FROM public.categories;

-- ============================================================
-- CATEGORIES SEED
-- ============================================================
INSERT INTO public.categories (id, name, slug, sort_order) VALUES
('b01fdb0b-e9b4-4b53-9113-17ab2fc77f01', '프론트엔드', 'frontend', 1),
('b01fdb0b-e9b4-4b53-9113-17ab2fc77f02', '백엔드', 'backend', 2),
('b01fdb0b-e9b4-4b53-9113-17ab2fc77f03', 'DevOps', 'devops', 3),
('b01fdb0b-e9b4-4b53-9113-17ab2fc77f04', '커리어', 'career', 4),
('b01fdb0b-e9b4-4b53-9113-17ab2fc77f05', '툴링', 'tooling', 5),
('b01fdb0b-e9b4-4b53-9113-17ab2fc77f06', '보안', 'security', 6),
('b01fdb0b-e9b4-4b53-9113-17ab2fc77f07', 'AI', 'ai', 7);

-- ============================================================
-- POSTS SEED
-- ============================================================
INSERT INTO public.posts (
    title, slug, excerpt, content, category_id,
    thumbnail_url, author_name, author_avatar_url,
    published_at, is_featured
) VALUES 
-- Featured Post (프론트엔드)
(
    '2024년 웹 개발 트렌드 총정리: 무엇을 준비해야 할까?', '2024-web-dev-trends',
    'AI 기반 개발 도구의 부상부터 WebAssembly의 활용성 증대까지, 올해 주목해야 할 주요 기술 트렌드를 심층 분석합니다.',
    '## 들어가며...', 'b01fdb0b-e9b4-4b53-9113-17ab2fc77f01',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
    '김코드', 'https://api.dicebear.com/7.x/avataaars/svg?seed=kimcode',
    NOW() - INTERVAL '10 minutes', TRUE
),
-- Side Posts
(
    'Kubernetes 클러스터 최적화 전략', 'kubernetes-cluster-optimization',
    '비용 절감과 성능 향상을 동시에 잡는 실전 노하우를 공유합니다.',
    '## Kubernetes...', 'b01fdb0b-e9b4-4b53-9113-17ab2fc77f03',
    'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&q=80',
    '박데브옵스', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parkdevops',
    NOW() - INTERVAL '2 days', FALSE
),
(
    'MSA 전환 실패 사례 분석', 'msa-failure-case-study',
    '무조건적인 마이크로서비스 전환이 위험한 이유와 대안을 알아봅니다.',
    '## MSA, 정말...', 'b01fdb0b-e9b4-4b53-9113-17ab2fc77f02',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    '이백엔드', 'https://api.dicebear.com/7.x/avataaars/svg?seed=leebackend',
    NOW() - INTERVAL '3 days', FALSE
),
-- Others
(
    'React Server Components: 실무 적용 가이드', 'react-server-components-guide',
    'Next.js 14와 함께 React Server Components를 도입하면서 겪었던 문제점들과 해결 방법을 공유합니다.',
    '## RSC...', 'b01fdb0b-e9b4-4b53-9113-17ab2fc77f01',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    '최리액트', 'https://api.dicebear.com/7.x/avataaars/svg?seed=choireact',
    '2024-03-15T00:00:00Z', FALSE
),
(
    '대규모 트래픽 처리를 위한 캐싱 전략 패턴 5가지', 'caching-strategy-patterns',
    'Redis를 활용한 Cache-Aside, Write-Through 등 다양한 캐싱 전략의 장단점과 실제 사용 사례를 비교 분석합니다.',
    '## 캐싱...', 'b01fdb0b-e9b4-4b53-9113-17ab2fc77f02',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80',
    '정시스템', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jeongsys',
    '2024-03-12T00:00:00Z', FALSE
),
(
    '생산성 200% 올려주는 VS Code 필수 확장 프로그램', 'vscode-extensions-productivity',
    '단순한 코드 편집기를 넘어 강력한 IDE로 변신시켜주는 필수 Extension 모음집. 설정 팁도 포함.',
    '## VS Code...', 'b01fdb0b-e9b4-4b53-9113-17ab2fc77f05',
    'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&q=80',
    '강툴링', 'https://api.dicebear.com/7.x/avataaars/svg?seed=kangtooling',
    '2024-03-10T00:00:00Z', FALSE
),
(
    'OWASP Top 10: 2024년 웹 보안 취약점 점검', 'owasp-top-10-2024',
    '웹 애플리케이션 개발 시 반드시 고려해야 할 보안 취약점들과 방어 코드를 예제와 함께 살펴봅니다.',
    '## OWASP...', 'b01fdb0b-e9b4-4b53-9113-17ab2fc77f06',
    'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80',
    '송시큐리티', 'https://api.dicebear.com/7.x/avataaars/svg?seed=songsecurity',
    '2024-03-08T00:00:00Z', FALSE
),
(
    '주니어 개발자를 위한 이력서 작성 A to Z', 'junior-developer-resume',
    '채용 담당자의 눈길을 끄는 이력서 작성법, 프로젝트 포트폴리오 구성 팁, 그리고 면접 준비 전략까지.',
    '## 좋은 이력서...', 'b01fdb0b-e9b4-4b53-9113-17ab2fc77f04',
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
    '윤커리어', 'https://api.dicebear.com/7.x/avataaars/svg?seed=yooncareer',
    '2024-03-05T00:00:00Z', FALSE
),
(
    '개발자를 위한 LLM 활용법: Copilot 그 이상', 'llm-developer-guide',
    '단순한 코드 완성을 넘어 아키텍처 설계, 리팩토링, 테스트 코드 작성에 AI를 활용하는 고급 기법을 소개합니다.',
    '## AI 활용...', 'b01fdb0b-e9b4-4b53-9113-17ab2fc77f07',
    'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    '임에이아이', 'https://api.dicebear.com/7.x/avataaars/svg?seed=imai',
    '2024-03-01T00:00:00Z', FALSE
);
