// app-firebase.js - Firebase 연동된 메인 애플리케이션 스크립트

// 전역 변수
let currentUser = null;
let myStories = [];
let classStories = [];

// DOM 요소 캐싱
const navButtons = document.querySelectorAll('.nav-button');
const appSections = document.querySelectorAll('.app-section');
const seasonCalendarButton = document.querySelector('.season-calendar-button');
const myStoryGrid = document.querySelector('#my-story .story-grid');
const classStoryGrid = document.querySelector('#class-story .story-grid');
const teacherArtworkList = document.querySelector('#teacher-tools .artwork-list');

const uploadModal = document.getElementById('uploadModal');
const drawingFileInput = document.getElementById('drawingFileInput');
const previewImage = document.getElementById('previewImage');
const drawingTitleInput = document.getElementById('drawingTitleInput');
const drawingStoryInput = document.getElementById('drawingStoryInput');

const storybookDropzone = document.getElementById('storybook-dropzone');
const pageSlots = document.querySelectorAll('.page-slot');
const currentPagePreviewImg = document.querySelector('#current-page-preview img');
const currentPagePreviewText = document.querySelector('#current-page-preview .preview-text');

// 업로드 관련 변수
let currentOriginalDrawingSrc = '';
let currentOriginalFile = null;

// --- 이미지 자르기(Crop) 관련 변수 및 DOM 요소 추가 ---
let cropper = null;
const cropModal = document.getElementById('cropModal');
const imageToCrop = document.getElementById('imageToCrop');


// 앱 초기화 함수
window.initializeApp = async function() {
    // 각 서비스 클라이언트는 app.html에서 이미 초기화됨
    if (!window.firebaseService || !window.supabaseStorageService) {
        console.error('필요한 서비스가 모두 로드되지 않았습니다.');
        return;
    }

    try {
        // 로그인 상태 확인
        const loggedInUserData = sessionStorage.getItem('loggedInUser');
        if (!loggedInUserData) {
            alert('로그인이 필요합니다.');
            window.location.href = 'index.html';
            return;
        }

        currentUser = JSON.parse(loggedInUserData);
        console.log('로그인 사용자:', currentUser);

        // 권한에 따른 UI 설정
        setupUIByRole();

        // 이벤트 리스너 설정
        setupEventListeners();

        // 초기 데이터 로드
        await loadStories();

        // 기본 섹션 활성화
        activateSection('my-story');

        console.log('앱 초기화 완료');
    } catch (error) {
        console.error('앱 초기화 오류:', error);
        alert('앱 로드 중 오류가 발생했습니다.');
    }
};

function setupUIByRole() {
    const teacherToolsNavButton = document.getElementById('teacherToolsNavButton');
    const teacherToolsSection = document.getElementById('teacher-tools'); // 섹션 DOM 요소 추가

    // 교사, 원장, 관리자 권한일 경우 '선생님 도구함' 버튼을 보여줍니다.
    if (currentUser.role === 'teacher' || currentUser.role === 'director' || currentUser.role === 'admin') {
        teacherToolsNavButton.style.display = 'flex';
        // 섹션은 기본적으로 숨김 처리합니다. (CSS 기본값에 따름)
    } else {
        // 그 외의 권한(원생 등)은 버튼과 섹션을 모두 숨깁니다.
        teacherToolsNavButton.style.display = 'none';
        teacherToolsSection.style.display = 'none';
    }
}
function setupEventListeners() {
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activateSection(button.dataset.target);
        });
    });

    seasonCalendarButton.addEventListener('click', () => {
        navButtons.forEach(btn => btn.classList.remove('active'));
        activateSection(seasonCalendarButton.dataset.target);
    });

    // 드래그 앤 드롭 이벤트
    setupDragAndDrop();
}
async function loadStories() {
    try {
        // 내 작품 로드
        myStories = await window.firebaseService.getStoriesByUser(currentUser.id);
        console.log('내 작품:', myStories);

        // 우리 반 작품 로드 (같은 사용처)
        classStories = await window.firebaseService.getStoriesByEstablishment(currentUser.establishmentId);
        console.log('우리 반 작품:', classStories);

    } catch (error) {
        console.error('작품 로드 오류:', error);
        // 에러가 발생해도 빈 배열로 초기화하여 앱이 계속 동작하도록 함
        myStories = [];
        classStories = [];
    }
}
function activateSection(targetId) {
    appSections.forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');

        if (targetId === 'my-story') {
            renderMyStoryCards();
        } else if (targetId === 'class-story') {
            renderClassStoryCards();
        } else if (targetId === 'teacher-tools') {
            // 이 섹션이 활성화될 때만 내용을 렌더링
            if (currentUser.role === 'teacher' || currentUser.role === 'director' || currentUser.role === 'admin') {
                renderTeacherArtworkList();
            } else {
                alert('선생님 도구함에 접근할 권한이 없습니다.');
                activateSection('my-story'); // 접근 권한 없으면 기본 페이지로
                document.querySelector('.nav-button[data-target="my-story"]').classList.add('active');
            }
        }
    }
}
window.handleLogout = function() {
    sessionStorage.removeItem('loggedInUser');
    alert('로그아웃되었습니다.');
    window.location.href = 'index.html';
};


function renderMyStoryCards() {
    // '새 그림 올리기' 카드를 제외하고 모두 지움
    myStoryGrid.querySelectorAll('.story-card:not(.upload-card)').forEach(card => card.remove());

    myStories.forEach(story => {
        const storyCard = createStoryCardElement(story);
        myStoryGrid.insertBefore(storyCard, myStoryGrid.querySelector('.upload-card').nextSibling);
    });
}
function renderClassStoryCards() {
    classStoryGrid.innerHTML = '';

    classStories.forEach(story => {
        const storyCard = createStoryCardElement(story, true); // class-story용 (좋아요/댓글)
        classStoryGrid.appendChild(storyCard);
    });
}
function createStoryCardElement(story, includeInteraction = false) {
    const storyCard = document.createElement('div');
    storyCard.classList.add('story-card');
    storyCard.dataset.storyId = story.id;

    const img = document.createElement('img');
    // [FIXED] aiImgUrl 대신 originalImgUrl을 사용합니다.
    img.src = story.originalImgUrl || 'images/placeholder_preview.png';
    img.alt = story.title;
    storyCard.appendChild(img);

    const cardInfo = document.createElement('div');
    cardInfo.classList.add('card-info');

    const displayDate = story.createdAt ?
        window.firebaseService.formatDate(story.createdAt) :
        story.date || new Date().toLocaleDateString('ko-KR');

    cardInfo.innerHTML = `
        <span class="story-title">${story.title}</span>
        <span class="story-date">${displayDate}</span>
    `;

    if (includeInteraction) {
        cardInfo.innerHTML += `
            <div class="interaction">
                <button class="like-button"><i class="fas fa-heart"></i> ${Math.floor(Math.random() * 10) + 1}</button>
                <button class="comment-button"><i class="fas fa-comment"></i> ${Math.floor(Math.random() * 5) + 1}</button>
            </div>
        `;
    } else {
        cardInfo.innerHTML += `
            <button class="play-audio"><i class="fas fa-play"></i></button>
        `;
    }
    storyCard.appendChild(cardInfo);

    storyCard.addEventListener('click', () => openStoryDetailModal(story.id));

    return storyCard;
}
function renderTeacherArtworkList() {
    teacherArtworkList.innerHTML = '';

    // 우리 반 모든 작품을 선생님 도구함에 표시
    classStories.forEach(story => {
        const artworkItem = document.createElement('div');
        artworkItem.classList.add('artwork-item');
        artworkItem.setAttribute('draggable', true);
        artworkItem.dataset.artworkId = story.id;
        // [FIXED] aiImg 대신 originalImgUrl을 사용하도록 데이터 속성 수정
        artworkItem.dataset.originalImg = story.originalImgUrl;
        artworkItem.dataset.title = story.title;
        artworkItem.dataset.storyText = story.storyText;

        // 업로더 정보 가져오기 (현재는 ID로 표시)
        const uploaderName = story.uploaderName || story.uploaderId || '알 수 없음';

        // [FIXED] 이미지 소스를 originalImgUrl로 변경하고, 불필요한 AI 아이콘 제거
        artworkItem.innerHTML = `
            <img src="${story.originalImgUrl || 'images/placeholder_preview.png'}" alt="${story.title}">
            <span>${story.title} (${uploaderName})</span>
        `;
        teacherArtworkList.appendChild(artworkItem);
    });

    attachDragAndDropListeners();
}


// ===================
// 새 그림 올리기 모달
// ===================

window.openUploadModal = function() {
    uploadModal.style.display = 'flex';
    // 입력 필드 초기화
    drawingFileInput.value = '';
    document.getElementById('cameraInput').value = '';
    previewImage.src = 'images/placeholder_preview.png';
    drawingTitleInput.value = '';
    drawingStoryInput.value = '';
    // 전역 변수 초기화
    currentOriginalDrawingSrc = '';
    currentOriginalFile = null;
};

window.closeUploadModal = function() {
    uploadModal.style.display = 'none';
};

window.previewOriginalDrawing = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageToCrop.src = e.target.result;
            cropModal.style.display = 'flex';

            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(imageToCrop, {
                aspectRatio: 0,
                viewMode: 1,
            });
        };
        reader.readAsDataURL(file);
    }
    event.target.value = '';
};

function closeCropModal() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    cropModal.style.display = 'none';
    imageToCrop.src = "";
}

window.cropImage = function() {
    if (cropper) {
        const canvas = cropper.getCroppedCanvas({
            imageSmoothingQuality: 'high',
        });

        previewImage.src = canvas.toDataURL();
        currentOriginalDrawingSrc = canvas.toDataURL();

        canvas.toBlob(function(blob) {
            const croppedFile = new File([blob], "cropped_image.png", { type: "image/png" });
            currentOriginalFile = croppedFile;
        }, 'image/png');

        closeCropModal();
    }
};

window.cancelCrop = function() {
    closeCropModal();
};


window.startRecording = function() {
    alert('이야기 녹음 기능은 현재 개발 중입니다! 텍스트로 입력해주세요.');
};

window.saveStory = async function() {
    const title = drawingTitleInput.value.trim();
    const storyText = drawingStoryInput.value.trim();

    if (!currentOriginalFile || !title) {
        alert('그림을 업로드하고 제목을 입력해주세요!');
        return;
    }

    try {
        const timestamp = Date.now();
        const fileExtension = currentOriginalFile.name.split('.').pop() || 'png';
        const imagePath = `public/${currentUser.id}/${timestamp}_original.${fileExtension}`;

        const imageUrl = await window.supabaseStorageService.uploadImage(currentOriginalFile, imagePath);

        await window.firebaseService.createStory({
            uploaderId: currentUser.id,
            uploaderName: currentUser.name,
            establishmentId: currentUser.establishmentId,
            title: title,
            storyText: storyText,
            originalImgUrl: imageUrl,
        });

        alert('그림이 저장되었습니다!');
        closeUploadModal();

        await loadStories();
        renderMyStoryCards();
        if (currentUser.role === 'teacher' || currentUser.role === 'director' || currentUser.role === 'admin') {
            renderTeacherArtworkList();
        }

    } catch (error) {
        console.error('작품 저장 오류:', error);
        alert('작품 저장 중 오류가 발생했습니다.');
    }
};

const storyDetailModalElement = document.getElementById('storyDetailModal');
const detailStoryTitle = document.getElementById('detailStoryTitle');
const detailOriginalImg = document.getElementById('detailOriginalImg');
const detailAiImg = document.getElementById('detailAiImg');
const detailStoryText = document.getElementById('detailStoryText');
const detailStoryDate = document.getElementById('detailStoryDate');

function openStoryDetailModal(storyId) {
    const allStories = [...myStories, ...classStories];
    const story = allStories.find(s => s.id === storyId);
    if (!story) return;

    detailStoryTitle.textContent = story.title;
    // [FIXED] originalImgUrl을 사용하고, AI 관련 이미지는 표시하지 않음
    detailOriginalImg.src = story.originalImgUrl || 'images/placeholder_preview.png';
    detailAiImg.style.display = 'none';
    detailStoryText.textContent = story.storyText || '이야기가 없습니다.';

    const displayDate = story.createdAt ?
        window.firebaseService.formatDate(story.createdAt) :
        story.date || new Date().toLocaleDateString('ko-KR');
    detailStoryDate.textContent = displayDate;

    storyDetailModalElement.style.display = 'flex';
}
window.closeStoryDetailModal = function() {
    storyDetailModalElement.style.display = 'none';
};
let draggedItem = null;
function setupDragAndDrop() {
    pageSlots.forEach(slot => {
        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            slot.style.backgroundColor = '#e0ffe0';
        });

        slot.addEventListener('dragleave', () => {
            slot.style.backgroundColor = '#f0f0f0';
        });

        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.style.backgroundColor = '#f0f0f0';

            const artworkId = e.dataTransfer.getData('artwork-id');
            const imgSrc = e.dataTransfer.getData('artwork-img-src');
            const title = e.dataTransfer.getData('artwork-title');
            const storyText = e.dataTransfer.getData('artwork-story-text');

            if (artworkId && imgSrc) {
                while (slot.firstChild) {
                    slot.removeChild(slot.firstChild);
                }

                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = title;
                img.dataset.artworkId = artworkId;
                img.dataset.artworkTitle = title;
                img.dataset.artworkStoryText = storyText;
                slot.appendChild(img);

                currentPagePreviewImg.src = imgSrc;
                currentPagePreviewText.textContent = `${title}의 이야기: "${storyText}"`;
            }
        });

        slot.addEventListener('click', () => {
            const imgInSlot = slot.querySelector('img');
            if (imgInSlot) {
                currentPagePreviewImg.src = imgInSlot.src;
                currentPagePreviewText.textContent = `${imgInSlot.dataset.artworkTitle}의 이야기: "${imgInSlot.dataset.artworkStoryText}"`;
            } else {
                currentPagePreviewImg.src = 'images/placeholder_preview.png';
                currentPagePreviewText.textContent = '선택된 페이지의 그림과 이야기가 여기에 표시됩니다.';
            }
        });
    });
}
function attachDragAndDropListeners() {
    const currentArtworkItems = document.querySelectorAll('.artwork-item');

    currentArtworkItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            e.dataTransfer.setData('artwork-id', e.target.dataset.artworkId);
            // [FIXED] aiImg 대신 originalImg 데이터 속성을 사용
            e.dataTransfer.setData('artwork-img-src', e.target.dataset.originalImg);
            e.dataTransfer.setData('artwork-title', e.target.dataset.title);
            e.dataTransfer.setData('artwork-story-text', e.target.dataset.storyText);
            setTimeout(() => {
                e.target.style.opacity = '0.5';
            }, 0);
        });

        item.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
            draggedItem = null;
        });
    });
}
window.previewStorybook = function() {
    alert('동화책 미리보기 기능은 동화책 뷰어 개발이 필요합니다!');
};
window.exportStorybook = function() {
    alert('PDF 내보내기 기능은 백엔드에서 PDF 생성 로직이 필요합니다!');
};
document.addEventListener('DOMContentLoaded', () => {
    console.log('앱 DOM 로드 완료');
    // Firebase 서비스 로드를 기다린 후 initializeApp이 호출됨
});
