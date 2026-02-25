const fs = require('fs');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "DevLog - 마크다운 블로그 플랫폼 개발 보고서",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                children: [new TextRun({ text: "1. 프로젝트 개요", bold: true, size: 28 })],
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
                text: "이 문서에서는 Next.js와 Supabase를 기반으로 한 개인용 마크다운 풀스택 블로그 플랫폼 'DevLog'의 개발 과정, 아키텍처, 주요 기능 변경 사항 및 향후 유지보수를 위한 세부 설정(어드민 제어)에 대해 설명합니다."
            }),
            // Part 1: Architecture
            new Paragraph({
                children: [new TextRun({ text: "2. 시스템 아키텍처 및 핵심 기술", bold: true, size: 28 })],
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
                text: "- 프레임워크: Next.js 14+ (App Router, Server Actions)\n- 스타일링: Tailwind CSS 3.4.1\n- 데이터베이스 / 인증: Supabase (PostgreSQL, Auth)\n- 텍스트/이미지 처리: react-markdown, remark-gfm, supabase storage"
            }),
            // Part 3: 검색 및 썸네일 노출 로직 수정
            new Paragraph({
                children: [new TextRun({ text: "3. 기능 추가 및 수정 (검색 및 썸네일)", bold: true, size: 28 })],
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
                text: "[검색 기능 개선]\n메인 Navbar 내장 검색 창에서 검색어 입력 후 Enter키 또는 돋보기 버튼을 클릭해 /search 라우트로 이동하도록 유도했습니다. 해당 검색 페이지에서는 URL 파라미터 q를 기반으로 Supabase ilike 쿼리를 실행해 제목(title) 일치 결과와 본문(content) 일치 결과 두 부분으로 나누어 렌더링하고, 본문 검색 중복 결과 처리까지 완료했습니다."
            }),
            new Paragraph({
                text: "[썸네일 추출 강화]\n에디터에서 첫 이미지를 업로드할 때, 해당 구문을 정규식(/!\\[.*?\\]\\((.*?)\\)/)으로 파싱하여 DB thumbnail_url 필드에 저장하여 홈 리스트에서도 정상적으로 렌더링 시키는 동작을 글쓰기 및 수정 화면(MarkdownEditor, EditMarkdownEditor) 전반에 걸쳐 구성했습니다."
            }),
            // Part 4: 관리자 계정과 권한 / 대시보드
            new Paragraph({
                children: [new TextRun({ text: "4. 어드민 시스템 구축 및 유저 제재(정지) 정책", bold: true, size: 28 })],
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
                text: "[데이터베이스 변경 (Migrations 008~013)]\n- profiles 테이블: role 필드 확장을 통해 일반 사용자(user)와 관리자(admin) 그룹을 나눌 수 있게 되었으며, suspended_until 컬럼을 통해 정지 기한을 체크할 수 있습니다.\n- site_settings 기능: 전역 설정으로 signup_enabled 옵션을 활성화/비활성화하여 현재 로그인 탭의 회원가입 폼 접속을 프론트엔드단에서 거부시키는 기능을 완성했습니다.\n- Auth Seed: 최상위 어드민인 ocarrotcakeo@gmail.com 계정을 생성하여 즉시 적용하였습니다."
            }),
            new Paragraph({
                text: "[프론트엔드 연동 및 대시보드]\n/admin UI를 추가하여 유저 정보 확인, 게시물 CUD 제어, 사이트 가입 상태 통제 및 1일/7일 단위 활동 정지, 나아가 강제 탈퇴 기능까지 단일 페이지 탭 형태에서 가능하도록 RPC 연계를 완료하여 백오피스의 틀을 확립했습니다."
            }),
            // Part 5: Methodology
            new Paragraph({
                children: [new TextRun({ text: "5. 프롬프트 엔지니어링 및 개발 방식 적용 가이드", bold: true, size: 28 })],
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
                text: "이 프로젝트는 효율적이고 일관된 개발을 위해 Google Antigravity 엔진 및 Google Stitch 도구를 도입하여 협업 프로그래밍을 진행했습니다. 모든 요청과 변경사항은 구체적인 도메인 목표, UI 디자인 기조, 권한 분리 등의 요구사항이 단계적으로 AI 에이전트와 주고받아져 도출되었으며, 단일 단위 및 전체 시스템 관점에서 구조적 결함 없이 병렬 마이그레이션이 이루어졌습니다."
            }),
            // Part 6: Troubleshooting
            new Paragraph({
                children: [new TextRun({ text: "6. 트러블슈팅 및 고려 사항", bold: true, size: 28 })],
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
                text: "- Supabase 정지 훅 개발 시, RLS의 WITH CHECK 보다는 실시간 트리거(plpgsql BEGIN~END) 제어를 통해 정지 유저의 글 및 댓글 생성을 근본적으로 차단하는 방식을 적용했습니다.\n- 클라이언트 컴포넌트(useEffect) 누락 린트 에러를 빠른 단계에서 교정하여 배포 빌드 실패를 선제적으로 방어했습니다."
            })
        ],
    }]
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("DevLog_개발보고서.docx", buffer);
    console.log("Document generated successfully");
});
