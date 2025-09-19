// app-firebase.js - Firebase 연동된 메인 애플리케이션 스크립트

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

// 수정 모달 DOM 요소
const editStoryModal = document.getElementById('editStoryModal');
const editStoryIdInput = document.getElementById('editStoryId');
const editPreviewImage = document.getElementById('editPreviewImage');
const editDrawingTitleInput = document.getElementById('editDrawingTitleInput');
const editDrawingStoryInput = document.getElementById('editDrawingStoryInput');

const storybookDropzone = document.getElementById('storybook-dropzone');
const pageSlots = document.querySelectorAll('.page-slot');
const currentPagePreviewImg = document.querySelector('#current-page-preview img');
const currentPagePreviewText = document.querySelector('#current-page-preview .preview-text');

let currentOriginalFile = null;
let cropper = null;
const cropModal = document.getElementById('cropModal');
const imageToCrop = document.getElementById('imageToCrop');

window.initializeApp = async function() {
    if (!window.firebaseService || !window.supabaseStorageService) {
        console.error('필요한 서비스가 모두 로드되지 않았습니다.');
        return;
    }
    try {
        const loggedInUserData = sessionStorage.getItem('loggedInUser');
        if (!loggedInUserData) {
            alert('로그인이 필요합니다.');
            window.location.href = 'index.html';
            return;
        }
        currentUser = JSON.parse(loggedInUserData);
        console.log('로그인 사용자:', currentUser);

        setupUIByRole();
        setupEventListeners();
        await loadAndRenderStories();
        activateSection('my-story');

        console.log('앱 초기화 완료');
    } catch (error) {
        console.error('앱 초기화 오류:', error);
        alert('앱 로드 중 오류가 발생했습니다.');
    }
};

async function loadAndRenderStories() {
    try {
        myStories = await window.firebaseService.getStoriesByUser(currentUser.id);
        classStories = await window.firebaseService.getStoriesByEstablishment(currentUser.establishmentId);
        renderMyStoryCards();
        renderClassStoryCards();
        if (['teacher', 'director', 'admin'].includes(currentUser.role)) {
            renderTeacherArtworkList();
        }
    } catch (error) {
        console.error('작품 로드 및 렌더링 오류:', error);
        myStories = [];
        classStories = [];
    }
}


function setupUIByRole() {
    const teacherToolsNavButton = document.getElementById('teacherToolsNavButton');
    if (['teacher', 'director', 'admin'].includes(currentUser.role)) {
        teacherToolsNavButton.style.display = 'flex';
    } else {
        teacherToolsNavButton.style.display = 'none';
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
    setupDragAndDrop();
}

function activateSection(targetId) {
    appSections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
        if (targetId === 'teacher-tools' && !['teacher', 'director', 'admin'].includes(currentUser.role)) {
             alert('선생님 도구함에 접근할 권한이 없습니다.');
             activateSection('my-story');
             document.querySelector('.nav-button[data-target="my-story"]').classList.add('active');
        }
    }
}

window.handleLogout = function() {
    sessionStorage.removeItem('loggedInUser');
    alert('로그아웃되었습니다.');
    window.location.href = 'index.html';
};

function renderMyStoryCards() {
    const uploadCard = myStoryGrid.querySelector('.upload-card');
    myStoryGrid.innerHTML = '';
    myStoryGrid.appendChild(uploadCard);
    myStories.forEach(story => {
        const storyCard = createStoryCardElement(story);
        myStoryGrid.appendChild(storyCard);
    });
}

function renderClassStoryCards() {
    classStoryGrid.innerHTML = '';
    classStories.forEach(story => {
        const storyCard = createStoryCardElement(story);
        classStoryGrid.appendChild(storyCard);
    });
}

function createStoryCardElement(story) {
    const storyCard = document.createElement('div');
    storyCard.classList.add('story-card');
    storyCard.dataset.storyId = story.id;

    // 카드 클릭 시 상세 보기
    const imageLink = document.createElement('a');
    imageLink.href = 'javascript:void(0)';
    imageLink.onclick = () => openStoryDetailModal(story.id);
    const img = document.createElement('img');
    img.src = story.originalImgUrl || 'images/placeholder_preview.png';
    img.alt = story.title;
    imageLink.appendChild(img);
    storyCard.appendChild(imageLink);

    const cardInfo = document.createElement('div');
    cardInfo.classList.add('card-info');
    const displayDate = story.createdAt ? window.firebaseService.formatDate(story.createdAt) : new Date().toLocaleDateString('ko-KR');
    cardInfo.innerHTML = `<span class="story-title">${story.title}</span><span class="story-date">${displayDate}</span>`;
    storyCard.appendChild(cardInfo);

    // 수정/삭제 버튼 추가
    const canModify = currentUser.id === story.uploaderId || ['teacher', 'director', 'admin'].includes(currentUser.role);
    if (canModify) {
        const cardActions = document.createElement('div');
        cardActions.classList.add('card-actions');
        cardActions.innerHTML = `
            <button class="btn-edit" onclick="openEditStoryModal('${story.id}')"><i class="fas fa-edit"></i> 수정</button>
            <button class="btn-delete" onclick="deleteStory('${story.id}')"><i class="fas fa-trash"></i> 삭제</button>
        `;
        storyCard.appendChild(cardActions);
    }
    return storyCard;
}


function renderTeacherArtworkList() {
    teacherArtworkList.innerHTML = '';
    classStories.forEach(story => {
        const artworkItem = document.createElement('div');
        artworkItem.classList.add('artwork-item');
        artworkItem.setAttribute('draggable', true);
        artworkItem.dataset.artworkId = story.id;
        artworkItem.dataset.originalImg = story.originalImgUrl;
        artworkItem.dataset.title = story.title;
        artworkItem.dataset.storyText = story.storyText;
        const uploaderName = story.uploaderName || '알 수 없음';
        artworkItem.innerHTML = `<img src="${story.originalImgUrl || 'images/placeholder_preview.png'}" alt="${story.title}"><span>${story.title} (${uploaderName})</span>`;
        teacherArtworkList.appendChild(artworkItem);
    });
    attachDragAndDropListeners();
}


window.openUploadModal = function() {
    uploadModal.style.display = 'flex';
    drawingFileInput.value = '';
    document.getElementById('cameraInput').value = '';
    previewImage.src = 'images/placeholder_preview.png';
    drawingTitleInput.value = '';
    drawingStoryInput.value = '';
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
            if (cropper) cropper.destroy();
            cropper = new Cropper(imageToCrop, { aspectRatio: 0, viewMode: 1 });
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
        const canvas = cropper.getCroppedCanvas({ imageSmoothingQuality: 'high' });
        previewImage.src = canvas.toDataURL();
        canvas.toBlob(blob => {
            currentOriginalFile = new File([blob], "cropped_image.png", { type: "image/png" });
        }, 'image/png');
        closeCropModal();
    }
};

window.cancelCrop = function() {
    closeCropModal();
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
            title,
            storyText,
            originalImgUrl: imageUrl,
        });

        alert('그림이 저장되었습니다!');
        closeUploadModal();
        await loadAndRenderStories();
    } catch (error) {
        console.error('작품 저장 오류:', error);
        alert('작품 저장 중 오류가 발생했습니다.');
    }
};

// --- 수정/삭제 기능 함수 ---
window.openEditStoryModal = function(storyId) {
    const story = [...myStories, ...classStories].find(s => s.id === storyId);
    if (story) {
        editStoryIdInput.value = story.id;
        editPreviewImage.src = story.originalImgUrl;
        editDrawingTitleInput.value = story.title;
        editDrawingStoryInput.value = story.storyText;
        editStoryModal.style.display = 'flex';
    }
};

window.closeEditStoryModal = function() {
    editStoryModal.style.display = 'none';
};

window.saveStoryChanges = async function() {
    const storyId = editStoryIdInput.value;
    const newTitle = editDrawingTitleInput.value.trim();
    const newStoryText = editDrawingStoryInput.value.trim();

    if (!newTitle) {
        alert('제목을 입력해주세요.');
        return;
    }

    try {
        await window.firebaseService.updateStory(storyId, {
            title: newTitle,
            storyText: newStoryText
        });
        alert('작품 정보가 수정되었습니다.');
        closeEditStoryModal();
        await loadAndRenderStories();
    } catch (error) {
        console.error('작품 수정 오류:', error);
        alert('작품 수정 중 오류가 발생했습니다.');
    }
};

window.deleteStory = async function(storyId) {
    if (confirm('정말 이 작품을 삭제하시겠습니까?')) {
        try {
            await window.firebaseService.deleteStory(storyId);
            alert('작품이 삭제되었습니다.');
            await loadAndRenderStories();
        } catch (error) {
            console.error('작품 삭제 오류:', error);
            alert('작품 삭제 중 오류가 발생했습니다.');
        }
    }
};


// --- 상세 보기 및 드래그 앤 드롭 (기존과 유사) ---
const storyDetailModalElement = document.getElementById('storyDetailModal');
const detailStoryTitle = document.getElementById('detailStoryTitle');
const detailOriginalImg = document.getElementById('detailOriginalImg');
const detailStoryText = document.getElementById('detailStoryText');
const detailStoryDate = document.getElementById('detailStoryDate');

function openStoryDetailModal(storyId) {
    const story = [...myStories, ...classStories].find(s => s.id === storyId);
    if (!story) return;

    detailStoryTitle.textContent = story.title;
    detailOriginalImg.src = story.originalImgUrl || 'images/placeholder_preview.png';
    detailStoryText.textContent = story.storyText || '이야기가 없습니다.';
    const displayDate = story.createdAt ? window.firebaseService.formatDate(story.createdAt) : new Date().toLocaleDateString('ko-KR');
    detailStoryDate.textContent = displayDate;
    storyDetailModalElement.style.display = 'flex';
}
window.closeStoryDetailModal = function() {
    storyDetailModalElement.style.display = 'none';
};
let draggedItem = null;
function setupDragAndDrop() {
    pageSlots.forEach(slot => {
        slot.addEventListener('dragover', e => {
            e.preventDefault();
            slot.style.backgroundColor = '#e0ffe0';
        });
        slot.addEventListener('dragleave', () => {
            slot.style.backgroundColor = '#f0f0f0';
        });
        slot.addEventListener('drop', e => {
            e.preventDefault();
            slot.style.backgroundColor = '#f0f0f0';
            const artworkId = e.dataTransfer.getData('artwork-id');
            const imgSrc = e.dataTransfer.getData('artwork-img-src');
            const title = e.dataTransfer.getData('artwork-title');
            const storyText = e.dataTransfer.getData('artwork-story-text');
            if (artworkId && imgSrc) {
                slot.innerHTML = `<img src="${imgSrc}" alt="${title}" data-artwork-id="${artworkId}" data-artwork-title="${title}" data-artwork-story-text="${storyText}">`;
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
        item.addEventListener('dragstart', e => {
            draggedItem = e.target;
            e.dataTransfer.setData('artwork-id', e.target.dataset.artworkId);
            e.dataTransfer.setData('artwork-img-src', e.target.dataset.originalImg);
            e.dataTransfer.setData('artwork-title', e.target.dataset.title);
            e.dataTransfer.setData('artwork-story-text', e.target.dataset.storyText);
            setTimeout(() => { e.target.style.opacity = '0.5'; }, 0);
        });
        item.addEventListener('dragend', e => {
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
