'use server'

import { revalidatePath } from 'next/cache'

/**
 * 메인 페이지('/')의 캐시를 강제로 무효화합니다.
 * 관리자 대시보드에서 게시물 설정을 변경했을 때 호출하여 
 * 사용자에게 즉각 상단 고정 게시물이 반영되도록 합니다.
 */
export async function revalidateHome() {
    revalidatePath('/', 'layout')
}
