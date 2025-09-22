// storybook-viewer.js - 공통 동화책 뷰어 모듈

let storybookPages = [];
let currentPageIndex = 0;
let isInitialized = false;

// DOM 요소는 한 번만 찾도록 initialize 함수 내부나 외부에 배치합니다.
// DOM이 로드된 후에 이 스크립트가 실행된다고 가정합니다.
const viewerModal = document.getElementById('storybookViewerModal');
const viewerImage = document.getElementById('viewerImage');
const viewerText = document.getElementById('viewerText');
const pageIndicator = document.getElementById('pageIndicator');
const prevPageButton = document.getElementById('prevPageButton');
const nextPageButton = document.getElementById('nextPageButton');
const exportPdfButton = document.getElementById('exportPdfButton'); // 관리자 페이지에만 존재할 수 있음

/**
 * 뷰어의 현재 페이지 내용을 업데이트합니다.
 */
function updateViewer() {
    if (!viewerModal || !storybookPages[currentPageIndex]) return;
    const page = storybookPages[currentPageIndex];
    viewerImage.src = page.image || 'images/placeholder_preview.png';
    viewerText.textContent = page.text || '';
    pageIndicator.textContent = `${currentPageIndex + 1} / ${storybookPages.length}`;

    if (currentPageIndex === storybookPages.length - 1) {
        nextPageButton.innerHTML = '처음으로 <i class="fas fa-redo"></i>';
    } else {
        nextPageButton.innerHTML = '다음 <i class="fas fa-arrow-right"></i>';
    }
}

/**
 * 이전 페이지를 보여줍니다.
 */
function showPrevPage() {
    if (currentPageIndex > 0) {
        currentPageIndex--;
        updateViewer();
    }
}

/**
 * 다음 페이지를 보여줍니다. 마지막 페이지에서는 처음으로 돌아갑니다.
 */
function showNextPage() {
    if (currentPageIndex < storybookPages.length - 1) {
        currentPageIndex++;
    } else {
        currentPageIndex = 0;
    }
    updateViewer();
}

/**
 * 뷰어 모달을 닫습니다.
 */
function closeStorybookViewer() {
    if (viewerModal) {
        viewerModal.style.display = 'none';
    }
}

/**
 * 뷰어 관련 이벤트 리스너를 초기화합니다.
 */
function initialize() {
    if (isInitialized || !viewerModal) return;

    prevPageButton.addEventListener('click', showPrevPage);
    nextPageButton.addEventListener('click', showNextPage);

    // 여러 닫기 버튼에 이벤트 리스너를 한 번에 할당합니다.
    const closeButtons = viewerModal.querySelectorAll('.viewer-close-button');
    closeButtons.forEach(btn => {
        // 기존에 있을 수 있는 onclick 속성을 제거하고 이벤트 리스너를 사용합니다.
        if (btn.hasAttribute('onclick')) {
            btn.removeAttribute('onclick');
        }
        btn.addEventListener('click', closeStorybookViewer);
    });

    // 관리자 페이지의 PDF 내보내기 버튼에 대한 처리
    if (exportPdfButton && typeof window.exportStorybookPDF === 'function') {
        exportPdfButton.addEventListener('click', window.exportStorybookPDF);
    }

    isInitialized = true;
    console.log('Common Storybook Viewer Initialized');
}

// DOM이 준비되면 초기화 함수를 실행합니다.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
} else {
    initialize();
}

/**
 * 저장된 동화책을 ID로 불러와 뷰어를 엽니다. (Firebase에서 데이터 로드)
 * @param {string} storyId - 불러올 동화책의 원본 story ID
 */
export async function openStorybookViewer(storyId) {
    if (!window.firebaseService) {
        console.error("Firebase service is not available.");
        alert("데이터 서비스를 불러올 수 없습니다.");
        return;
    }

    try {
        const storybook = await window.firebaseService.getStorybookByStoryId(storyId);
        if (storybook && storybook.pages && storybook.pages.length > 0) {
            storybookPages = storybook.pages;
            currentPageIndex = 0;
            updateViewer();
            viewerModal.style.display = 'flex';
        } else {
            alert('제작된 동화책을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error("동화책 로딩 오류:", error);
        alert("동화책을 불러오는 중 오류가 발생했습니다.");
    }
}

/**
 * 저장되지 않은 페이지 데이터로 뷰어를 엽니다. (관리자 페이지 미리보기용)
 * @param {Array<Object>} pages - 미리보기할 페이지 객체 배열
 */
export function previewStorybook(pages) {
    if (pages && pages.length > 0) {
        storybookPages = pages;
        currentPageIndex = 0;
        updateViewer();
        viewerModal.style.display = 'flex';
    } else {
        alert('미리보기할 페이지가 없습니다.');
    }
}

// 다른 스크립트에서 접근할 수 있도록 전역 네임스페이스에 함수를 할당합니다.
window.magicStorybook = window.magicStorybook || {};
window.magicStorybook.openStorybookViewer = openStorybookViewer;
window.magicStorybook.previewStorybook = previewStorybook;
