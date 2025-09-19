// app-firebase.js - Firebase 연동된 메인 애플리케이션 스크립트

// 전역 변수
let currentUser = null;
let myStories = [];
let classStories = [];
let allUsers = []; // 전체 사용자 목록 캐싱
let allEstablishments = []; // 전체 교육기관 목록 캐싱

// DOM 요소 캐싱
const navButtons = document.querySelectorAll('.nav-button');
const appSections = document.querySelectorAll('.app-section');
const seasonCalendarButton = document.querySelector('.season-calendar-button');
const myStoryGrid = document.querySelector('#my-story .story-grid');
const classStoryGrid = document.querySelector('#class-story .story-grid');
const teacherArtworkList = document.querySelector('#teacher-tools .artwork-list');

// 모달 및 입력 관련 DOM 요소
const uploadModal = document.getElementById('uploadModal');
const drawingFileInput = document.getElementById('drawingFileInput');
const previewImage = document.getElementById('previewImage');
const drawingTitleInput = document.getElementById('drawingTitleInput');
const drawingStoryInput = document.getElementById('drawingStoryInput');
const uploadEstablishmentSelect = document.getElementById('uploadEstablishmentSelect');
const uploadStudentSelect = document.getElementById('uploadStudentSelect');


const editStoryModal = document.getElementById('editStoryModal');
const editStoryIdInput = document.getElementById('editStoryId');
const editPreviewImage = document.getElementById('editPreviewImage');
const editDrawingTitleInput = document.getElementById('editDrawingTitleInput');
const editDrawingStoryInput = document.getElementById('editDrawingStoryInput');

const storyDetailModalElement = document.getElementById('storyDetailModal');
const detailStoryTitle = document.getElementById('detailStoryTitle');
const detailOriginalImg = document.getElementById('detailOriginalImg');
const detailStoryText = document.getElementById('detailStoryText');
const detailStoryDate = document.getElementById('detailStoryDate');

// 기타 UI 요소
const storybookDropzone = document.getElementById('storybook-dropzone');
const pageSlots = document.querySelectorAll('.page-slot');
const currentPagePreviewImg = document.querySelector('#current-page-preview img');
const currentPagePreviewText = document.querySelector('#current-page-preview .preview-text');

// 업로드 및 크롭 관련 변수
let currentOriginalFile = null;
let cropper = null;
const cropModal = document.getElementById('cropModal');
const imageToCrop = document.getElementById('imageToCrop');

/**
 * 앱 초기화 함수
 */
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

        // 관리자 또는 교사인 경우, 사용자 및 기관 목록을 미리 로드
        if (['admin', 'teacher', 'director'].includes(currentUser.role)) {
            [allUsers, allEstablishments] = await Promise.all([
                window.firebaseService.getAllUsers(),
                window.firebaseService.getAllEstablishments()
            ]);
        }


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

/**
 * 모든 스토리(내 그림, 우리 반/전체)를 로드하고 화면에 렌더링
 */
async function loadAndRenderStories() {
    try {
        console.log('작품 데이터 로드를 시작합니다...');
        myStories = await window.firebaseService.getStoriesByUser(currentUser.id);
        
        // ✨ 관리자일 경우와 아닐 경우를 분리하여 데이터를 로드합니다.
        if (currentUser.role === 'admin') {
            // 관리자는 모든 기관의 작품을 불러옵니다.
            console.log('관리자 권한으로 모든 작품을 로드합니다.');
            classStories = await window.firebaseService.getAllStories();
        } else {
            // 교사, 원생 등은 소속된 기관의 작품만 불러옵니다.
            console.log(`'${currentUser.establishmentId}' 기관의 작품을 로드합니다.`);
            classStories = await window.firebaseService.getStoriesByEstablishment(currentUser.establishmentId);
        }
        
        console.log('Firebase에서 가져온 [내 작품] 데이터:', myStories);
        console.log('Firebase에서 가져온 [선생님 도구함/우리반] 데이터:', classStories);

        renderMyStoryCards();
        renderClassStoryCards();

        if (['teacher', 'director', 'admin'].includes(currentUser.role)) {
            renderTeacherArtworkList();
        }
        console.log('작품 렌더링이 완료되었습니다.');
    } catch (error) {
        console.error('작품 로드 및 렌더링 오류:', error);
        myStories = [];
        classStories = [];
    }
}

/**
 * 사용자 역할에 따라 UI 설정 (예: 선생님 도구함 표시/숨김)
 */
function setupUIByRole() {
    const teacherToolsNavButton = document.getElementById('teacherToolsNavButton');
    if (['teacher', 'director', 'admin'].includes(currentUser.role)) {
        teacherToolsNavButton.style.display = 'flex';
    } else {
        teacherToolsNavButton.style.display = 'none';
    }
}

/**
 * 기본 이벤트 리스너 설정
 */
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
    uploadEstablishmentSelect.addEventListener('change', populateStudentOptionsForAdmin);
}

/**
 * 특정 섹션을 활성화하는 함수
 * @param {string} targetId - 활성화할 섹션의 ID
 */
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

/**
 * 로그아웃 처리
 */
window.handleLogout = function() {
    sessionStorage.removeItem('loggedInUser');
    alert('로그아웃되었습니다.');
    window.location.href = 'index.html';
};


// --- 스토리 카드 렌더링 ---

/**
 * '내 그림 이야기' 섹션의 카드들을 렌더링
 */
function renderMyStoryCards() {
    myStoryGrid.querySelectorAll('.story-card:not(.upload-card)').forEach(card => card.remove());
    myStories.forEach(story => {
        const storyCard = createStoryCardElement(story);
        myStoryGrid.appendChild(storyCard);
    });
}

/**
 * '우리 반 이야기' 섹션의 카드들을 렌더링
 */
function renderClassStoryCards() {
    classStoryGrid.innerHTML = '';
    classStories.forEach(story => {
        const storyCard = createStoryCardElement(story);
        classStoryGrid.appendChild(storyCard);
    });
}

/**
 * 스토리 카드 DOM 요소를 생성
 * @param {object} story - 스토리 데이터
 * @returns {HTMLElement} - 생성된 스토리 카드 요소
 */
function createStoryCardElement(story) {
    const storyCard = document.createElement('div');
    storyCard.classList.add('story-card');
    storyCard.dataset.storyId = story.id;

    const imageLink = document.createElement('a');
    imageLink.href = 'javascript:void(0)';
    imageLink.onclick = (event) => {
        if (!event.target.closest('button')) {
            openStoryDetailModal(story.id);
        }
    };

    const img = document.createElement('img');
    const imageUrl = story.originalImgUrl || 'images/placeholder_preview.png';
    
    console.log(`[카드 렌더링] 제목: "${story.title}", 이미지 URL: ${imageUrl}`);
    
    img.src = imageUrl;
    img.alt = story.title;
    imageLink.appendChild(img);
    storyCard.appendChild(imageLink);

    const cardInfo = document.createElement('div');
    cardInfo.classList.add('card-info');
    const displayDate = story.createdAt ? window.firebaseService.formatDate(story.createdAt) : new Date().toLocaleDateString('ko-KR');
    cardInfo.innerHTML = `<span class="story-title">${story.title}</span><span class="story-date">${displayDate}</span>`;
    storyCard.appendChild(cardInfo);

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

/**
 * '선생님 도구함'의 작품 목록을 렌더링
 */
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
        
        const imageUrl = story.originalImgUrl || 'images/placeholder_preview.png';
        console.log(`[선생님 도구함] 제목: "${story.title}", 이미지 URL: ${imageUrl}`);
        
        artworkItem.innerHTML = `<img src="${imageUrl}" alt="${story.title}"><span>${story.title} (${uploaderName})</span>`;
        teacherArtworkList.appendChild(artworkItem);
    });
    attachDragAndDropListeners();
}


// --- 새 그림 올리기 / 수정 / 삭제 ---

// [수정됨]
window.openUploadModal = function() {
    // 초기화
    drawingFileInput.value = '';
    document.getElementById('cameraInput').value = '';
    previewImage.src = 'images/placeholder_preview.png';
    drawingTitleInput.value = '';
    drawingStoryInput.value = '';
    currentOriginalFile = null;
    uploadEstablishmentSelect.style.display = 'none';
    uploadStudentSelect.style.display = 'none';
    uploadEstablishmentSelect.innerHTML = '';
    uploadStudentSelect.innerHTML = '';


    // 역할에 따른 드롭다운 설정
    if (['teacher', 'director'].includes(currentUser.role)) {
        uploadStudentSelect.style.display = 'block';
        uploadStudentSelect.innerHTML = '<option value="">(내 이름으로 올리기)</option>';
        const students = allUsers.filter(u => u.establishmentId === currentUser.establishmentId && u.role === 'student');
        students.forEach(student => {
            uploadStudentSelect.innerHTML += `<option value="${student.id}">${student.name}</option>`;
        });
    } else if (currentUser.role === 'admin') {
        uploadEstablishmentSelect.style.display = 'block';
        uploadStudentSelect.style.display = 'block';
        uploadEstablishmentSelect.innerHTML = '<option value="">-- 교육기관 선택 --</option>';
        allEstablishments.forEach(est => {
            uploadEstablishmentSelect.innerHTML += `<option value="${est.id}">${est.name}</option>`;
        });
        uploadStudentSelect.innerHTML = '<option value="">-- 원생 선택 --</option>';
    }

    uploadModal.style.display = 'flex';
};

// [추가됨] 관리자가 교육기관을 선택했을 때 원생 목록을 채우는 함수
function populateStudentOptionsForAdmin() {
    const selectedEstId = uploadEstablishmentSelect.value;
    uploadStudentSelect.innerHTML = '<option value="">-- 원생 선택 --</option>';
    if (selectedEstId) {
        const students = allUsers.filter(u => u.establishmentId === selectedEstId && u.role === 'student');
        students.forEach(student => {
            uploadStudentSelect.innerHTML += `<option value="${student.id}">${student.name}</option>`;
        });
    }
}


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

// [수정됨]
window.saveStory = async function() {
    const title = drawingTitleInput.value.trim();
    const storyText = drawingStoryInput.value.trim();
    if (!currentOriginalFile || !title) {
        alert('그림을 업로드하고 제목을 입력해주세요!');
        return;
    }

    let uploader = {
        id: currentUser.id,
        name: currentUser.name,
        establishmentId: currentUser.establishmentId
    };

    // 교사/관리자가 다른 학생을 선택했는지 확인
    const selectedStudentId = uploadStudentSelect.value;
    if (selectedStudentId) {
        const selectedStudent = allUsers.find(u => u.id === selectedStudentId);
        if (selectedStudent) {
            uploader = {
                id: selectedStudent.id,
                name: selectedStudent.name,
                establishmentId: selectedStudent.establishmentId
            };
        }
    } else if (currentUser.role === 'admin') {
        alert('관리자는 반드시 교육기관과 원생을 선택해야 합니다.');
        return;
    }


    try {
        const timestamp = Date.now();
        const fileExtension = currentOriginalFile.name.split('.').pop() || 'png';
        const imagePath = `${uploader.id}/${timestamp}_original.${fileExtension}`;
        const imageUrl = await window.supabaseStorageService.uploadImage(currentOriginalFile, imagePath);
        
        console.log(`[저장 완료] 제목: "${title}", 최종 저장 URL: ${imageUrl}`);

        await window.firebaseService.createStory({
            uploaderId: uploader.id,
            uploaderName: uploader.name,
            establishmentId: uploader.establishmentId,
            title,
            storyText,
            originalImgUrl: imageUrl,
            aiProcessed: false
        });
        alert('그림이 저장되었습니다!');
        closeUploadModal();
        await loadAndRenderStories();
    } catch (error) {
        console.error('작품 저장 오류:', error);
        alert('작품 저장 중 오류가 발생했습니다.');
    }
};

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
    if (confirm('정말 이 작품을 삭제하시겠습니까? 삭제된 그림은 복구할 수 없습니다.')) {
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


// --- 상세 보기 및 드래그 앤 드롭 ---

function openStoryDetailModal(storyId) {
    const story = [...myStories, ...classStories].find(s => s.id === storyId);
    if (!story) return;
    detailStoryTitle.textContent = story.title;
    
    const imageUrl = story.originalImgUrl || 'images/placeholder_preview.png';
    console.log(`[상세 보기] 제목: "${story.title}", 이미지 URL: ${imageUrl}`);
    
    detailOriginalImg.src = imageUrl;
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
        slot.addEventListener('dragover', e => { e.preventDefault(); slot.style.backgroundColor = '#e0ffe0'; });
        slot.addEventListener('dragleave', () => { slot.style.backgroundColor = '#f0f0f0'; });
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
