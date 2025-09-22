// app-firebase.js - Firebase 연동된 메인 애플리케이션 스크립트

// 전역 변수
let currentUser = null;
let myStories = [];
let classStories = [];
let allUsers = []; // 전체 사용자 목록 캐싱
let allEstablishments = []; // 전체 교육기관 목록 캐싱
let themes = []; // 테마 목록 캐싱
let activeTheme = null; // 활성 테마 캐싱
let storybookPages = []; // 동화책 미리보기 데이터
let currentPageIndex = 0;


// DOM 요소 캐싱
const navButtons = document.querySelectorAll('.nav-button');
const appSections = document.querySelectorAll('.app-section');
const myStoryGrid = document.querySelector('#my-story .story-grid');
const classStoryGrid = document.querySelector('#class-story .story-grid');
const teacherArtworkList = document.querySelector('#teacher-tools .artwork-list');
const themeFilter = document.getElementById('themeFilter');
const classThemeFilter = document.getElementById('classThemeFilter');
const bulkRegisterButton = document.getElementById('bulkRegisterButton');


// 모달 및 입력 관련 DOM 요소
const uploadModal = document.getElementById('uploadModal');
const drawingFileInput = document.getElementById('drawingFileInput');
const previewImage = document.getElementById('previewImage');
const drawingTitleInput = document.getElementById('drawingTitleInput');
const drawingStoryInput = document.getElementById('drawingStoryInput');
const uploadEstablishmentSelect = document.getElementById('uploadEstablishmentSelect');
const uploadStudentSelect = document.getElementById('uploadStudentSelect');
const themeSelect = document.getElementById('themeSelect');
const themeSelectContainer = document.getElementById('themeSelectContainer');
const editThemeSelect = document.getElementById('editThemeSelect');


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
const detailStoryTheme = document.getElementById('detailStoryTheme');


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

    // 전역 함수 할당
    window.openStorybookViewer = openStorybookViewer;
    window.closeStorybookViewer = closeStorybookViewer;
    
    try {
        const loggedInUserData = sessionStorage.getItem('loggedInUser');
        if (!loggedInUserData) {
            alert('로그인이 필요합니다.');
            window.location.href = 'index.html';
            return;
        }
        currentUser = JSON.parse(loggedInUserData);
        console.log('로그인 사용자:', currentUser);

        if (['admin', 'teacher', 'director'].includes(currentUser.role)) {
            [allUsers, allEstablishments] = await Promise.all([
                window.firebaseService.getAllUsers(),
                window.firebaseService.getAllEstablishments()
            ]);
        }
        
        [themes, activeTheme] = await Promise.all([
             window.firebaseService.getThemesByEstablishment(currentUser.establishmentId),
             window.firebaseService.getActiveTheme(currentUser.establishmentId)
        ]);
        populateThemeFilter();


        setupUIByRole();
        setupEventListeners();
        await loadAndRenderStories();
        const initialTheme = activeTheme ? activeTheme.id : 'all';
        themeFilter.value = initialTheme;
        classThemeFilter.value = initialTheme;
        activateSection('my-story');
        renderMyStoryCards(initialTheme);


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
        
        if (currentUser.role === 'admin') {
            classStories = await window.firebaseService.getAllStories();
        } else {
            classStories = await window.firebaseService.getStoriesByEstablishment(currentUser.establishmentId);
        }
        
        renderMyStoryCards(themeFilter.value);
        renderClassStoryCards(classThemeFilter.value);

        if (currentUser.role === 'admin') {
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
 * 사용자 역할에 따라 UI 설정
 */
function setupUIByRole() {
    const teacherToolsNavButton = document.getElementById('teacherToolsNavButton');
    if (currentUser.role === 'admin') {
        teacherToolsNavButton.style.display = 'flex';
    } else {
        teacherToolsNavButton.style.display = 'none';
    }

    if (['teacher', 'director'].includes(currentUser.role)) {
        bulkRegisterButton.style.display = 'block';
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

    themeFilter.addEventListener('change', () => renderMyStoryCards(themeFilter.value));
    classThemeFilter.addEventListener('change', () => renderClassStoryCards(classThemeFilter.value));
    bulkRegisterButton.addEventListener('click', handleBulkRegister);
    setupDragAndDrop();
    uploadEstablishmentSelect.addEventListener('change', populateStudentOptionsForAdmin);
    
    // 동화책 뷰어 컨트롤
    document.getElementById('prevPageButton').addEventListener('click', showPrevPage);
    document.getElementById('nextPageButton').addEventListener('click', showNextPage);
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
        
        if (targetId === 'my-story') {
            renderMyStoryCards(themeFilter.value);
        } else if (targetId === 'class-story') {
            renderClassStoryCards(classThemeFilter.value);
        }
        
        if (targetId === 'teacher-tools' && currentUser.role !== 'admin') {
             alert('이 기능은 관리자만 사용할 수 있습니다.');
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

function renderMyStoryCards(filterThemeId = 'all') {
    myStoryGrid.querySelectorAll('.story-card:not(.upload-card)').forEach(card => card.remove());
    
    let filteredStories = myStories;
    if (filterThemeId !== 'all') {
        filteredStories = myStories.filter(story => story.themeId === filterThemeId);
    }
    
    filteredStories.forEach(story => {
        const storyCard = createStoryCardElement(story);
        myStoryGrid.appendChild(storyCard);
    });
}

function renderClassStoryCards(filterThemeId = 'all') {
    classStoryGrid.innerHTML = '';

    let filteredStories = classStories;
    if (filterThemeId !== 'all') {
        filteredStories = classStories.filter(story => story.themeId === filterThemeId);
    }

    filteredStories.forEach(story => {
        const storyCard = createStoryCardElement(story, true);
        classStoryGrid.appendChild(storyCard);
    });
}

// [수정된 함수]
function createStoryCardElement(story, isClassStory = false) {
    const storyCard = document.createElement('div');
    storyCard.classList.add('story-card');
    storyCard.dataset.storyId = story.id;
    if (story.status === 'unregistered') {
        storyCard.dataset.unregistered = 'true';
    }

    const imageLink = document.createElement('a');
    imageLink.href = 'javascript:void(0)';
    imageLink.onclick = (event) => {
        if (!event.target.closest('button')) {
            openStoryDetailModal(story.id);
        }
    };

    const img = document.createElement('img');
    const imageUrl = story.originalImgUrl || 'images/placeholder_preview.png';
    
    img.src = imageUrl;
    img.alt = story.title;
    imageLink.appendChild(img);
    storyCard.appendChild(imageLink);

    const cardInfo = document.createElement('div');
    cardInfo.classList.add('card-info');
    const displayDate = story.createdAt ? window.firebaseService.formatDate(story.createdAt) : new Date().toLocaleDateString('ko-KR');
    const theme = themes.find(t => t.id === story.themeId);
    const themeName = theme ? theme.name : '미지정';
    cardInfo.innerHTML = `<span class="story-title">${story.title}</span><span class="story-date">${displayDate} / ${themeName}</span>`;
    storyCard.appendChild(cardInfo);

    const cardActions = document.createElement('div');
    cardActions.classList.add('card-actions');
    
    const canModify = currentUser.id === story.uploaderId || ['teacher', 'director', 'admin'].includes(currentUser.role);
    
    // '제작 완료' 상태와 상관없이 수정/삭제 버튼을 항상 표시하도록 변경
    if (canModify) {
        cardActions.innerHTML += `
            <button class="btn-edit" onclick="openEditStoryModal('${story.id}')"><i class="fas fa-edit"></i> 수정</button>
            <button class="btn-delete" onclick="deleteStory('${story.id}')"><i class="fas fa-trash"></i> 삭제</button>
        `;
    }
    
    if (isClassStory && ['teacher', 'director'].includes(currentUser.role) && story.status !== 'completed') {
        const registerButton = document.createElement('button');
        const status = story.status || 'unregistered';
        registerButton.dataset.storyId = story.id;
        registerButton.dataset.status = status;
        
        if (status === 'registered' || status === 'in_production') {
            registerButton.textContent = '등록됨';
            registerButton.classList.add('btn-registered');
        } else {
            registerButton.textContent = '등록';
            registerButton.classList.add('btn-register');
        }
        registerButton.onclick = () => handleRegisterToggle(story.id, status);
        cardActions.appendChild(registerButton);
    }

    if (story.status === 'completed') {
        cardActions.innerHTML += `<button class="btn-view-book" onclick="openStorybookViewer('${story.id}')"><i class="fas fa-book"></i> 동화책 보기</button>`;
    }
    
    storyCard.appendChild(cardActions);
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
        
        const imageUrl = story.originalImgUrl || 'images/placeholder_preview.png';
        
        artworkItem.innerHTML = `<img src="${imageUrl}" alt="${story.title}"><span>${story.title} (${uploaderName})</span>`;
        teacherArtworkList.appendChild(artworkItem);
    });
    attachDragAndDropListeners();
}

// --- 작품 등록 관련 ---

async function handleRegisterToggle(storyId, currentStatus) {
    if (currentStatus === 'in_production') {
        alert('현재 제작중인 작품은 등록을 취소할 수 없습니다.');
        return;
    }
    const isRegistering = (currentStatus === 'unregistered');
    const confirmMessage = isRegistering ?
        "이 작품을 동화 제작 목록에 등록하시겠습니까?" :
        "이 작품의 등록을 취소하시겠습니까?";
    if (confirm(confirmMessage)) {
        try {
            const newStatus = isRegistering ? 'registered' : 'unregistered';
            await window.firebaseService.updateStory(storyId, { status: newStatus });
            alert(isRegistering ? '작품이 등록되었습니다.' : '작품 등록이 취소되었습니다.');
            await loadAndRenderStories();
        } catch (error) {
            console.error('작품 상태 변경 오류:', error);
            alert('작품 상태 변경 중 오류가 발생했습니다.');
        }
    }
}

async function handleBulkRegister() {
    const unregisteredCards = classStoryGrid.querySelectorAll('.story-card[data-unregistered="true"]');
    if (unregisteredCards.length === 0) {
        alert('등록할 작품이 없습니다.');
        return;
    }
    if (confirm(`미등록된 ${unregisteredCards.length}개의 작품을 모두 등록하시겠습니까?`)) {
        try {
            const updatePromises = Array.from(unregisteredCards).map(card => {
                const storyId = card.dataset.storyId;
                return window.firebaseService.updateStory(storyId, { status: 'registered' });
            });
            await Promise.all(updatePromises);
            alert('모든 미등록 작품이 등록되었습니다.');
            await loadAndRenderStories();
        } catch (error) {
            console.error('일괄 등록 처리 오류:', error);
            alert('일괄 등록 중 오류가 발생했습니다.');
        }
    }
}


// --- 새 그림 올리기 / 수정 / 삭제 ---

window.openUploadModal = function() {
    if (currentUser.role === 'student' && !activeTheme) {
        alert('현재 등록 가능한 활성 테마가 없습니다. 선생님께 문의해주세요.');
        return;
    }

    if(drawingFileInput) drawingFileInput.value = '';
    if(previewImage) previewImage.src = 'images/placeholder_preview.png';
    if(drawingTitleInput) drawingTitleInput.value = '';
    if(drawingStoryInput) drawingStoryInput.value = '';
    currentOriginalFile = null;
    if(uploadEstablishmentSelect) {
        uploadEstablishmentSelect.style.display = 'none';
        uploadEstablishmentSelect.innerHTML = '';
    }
    if(uploadStudentSelect) {
        uploadStudentSelect.style.display = 'none';
        uploadStudentSelect.innerHTML = '';
    }
    
    if (currentUser.role === 'student') {
        if(themeSelectContainer) themeSelectContainer.style.display = 'none';
    } else {
        if(themeSelectContainer) themeSelectContainer.style.display = 'block';
        populateThemeOptions(themeSelect, activeTheme ? activeTheme.id : null);
    }

    if (['teacher', 'director'].includes(currentUser.role)) {
        if(uploadStudentSelect) {
            uploadStudentSelect.style.display = 'block';
            uploadStudentSelect.innerHTML = '<option value="">(내 이름으로 올리기)</option>';
            const students = allUsers.filter(u => u.establishmentId === currentUser.establishmentId && u.role === 'student');
            students.forEach(student => {
                uploadStudentSelect.innerHTML += `<option value="${student.id}">${student.name}</option>`;
            });
        }
    } else if (currentUser.role === 'admin') {
        if(uploadEstablishmentSelect) uploadEstablishmentSelect.style.display = 'block';
        if(uploadStudentSelect) uploadStudentSelect.style.display = 'block';
        
        if(uploadEstablishmentSelect) {
            uploadEstablishmentSelect.innerHTML = '<option value="">-- 교육기관 선택 --</option>';
            allEstablishments.forEach(est => {
                uploadEstablishmentSelect.innerHTML += `<option value="${est.id}">${est.name}</option>`;
            });
        }
        if(uploadStudentSelect) uploadStudentSelect.innerHTML = '<option value="">-- 원생 선택 --</option>';
    }

    if(uploadModal) uploadModal.style.display = 'flex';
};

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

window.saveStory = async function() {
    const title = drawingTitleInput.value.trim();
    const storyText = drawingStoryInput.value.trim();
    const selectedThemeId = currentUser.role === 'student' ? activeTheme.id : themeSelect.value;

    if (!currentOriginalFile || !title || !selectedThemeId) {
        alert('그림, 제목, 테마를 모두 선택 및 입력해주세요!');
        return;
    }

    let uploader = {
        id: currentUser.id,
        name: currentUser.name,
        establishmentId: currentUser.establishmentId
    };

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
        
        await window.firebaseService.createStory({
            uploaderId: uploader.id,
            uploaderName: uploader.name,
            establishmentId: uploader.establishmentId,
            title,
            storyText,
            themeId: selectedThemeId,
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
        populateThemeOptions(editThemeSelect, story.themeId);
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
    const newThemeId = editThemeSelect.value;

    if (!newTitle || !newThemeId) {
        alert('제목과 테마를 모두 입력해주세요.');
        return;
    }
    try {
        await window.firebaseService.updateStory(storyId, {
            title: newTitle,
            storyText: newStoryText,
            themeId: newThemeId
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

// --- 상세 보기 및 테마 관련 ---

function openStoryDetailModal(storyId) {
    const story = [...myStories, ...classStories].find(s => s.id === storyId);
    if (!story) return;
    detailStoryTitle.textContent = story.title;
    
    const imageUrl = story.originalImgUrl || 'images/placeholder_preview.png';
    
    detailOriginalImg.src = imageUrl;
    detailStoryText.textContent = story.storyText || '이야기가 없습니다.';
    const displayDate = story.createdAt ? window.firebaseService.formatDate(story.createdAt) : new Date().toLocaleDateString('ko-KR');
    const theme = themes.find(t => t.id === story.themeId);
    detailStoryDate.textContent = displayDate;
    detailStoryTheme.textContent = theme ? theme.name : '미지정';
    storyDetailModalElement.style.display = 'flex';
}

window.closeStoryDetailModal = function() {
    storyDetailModalElement.style.display = 'none';
};

function populateThemeFilter() {
    themeFilter.innerHTML = '<option value="all">전체보기</option>';
    classThemeFilter.innerHTML = '<option value="all">전체보기</option>';
    themes.forEach(theme => {
        themeFilter.innerHTML += `<option value="${theme.id}">${theme.name}</option>`;
        classThemeFilter.innerHTML += `<option value="${theme.id}">${theme.name}</option>`;
    });
}

function populateThemeOptions(selectElement, selectedId = null) {
    selectElement.innerHTML = '<option value="">-- 테마 선택 --</option>';
    themes.forEach(theme => {
        const selected = theme.id === selectedId ? 'selected' : '';
        selectElement.innerHTML += `<option value="${theme.id}" ${selected}>${theme.name}</option>`;
    });
}


// --- 드래그 앤 드롭 ---

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

// --- 동화책 뷰어 관련 (app.html) ---
async function openStorybookViewer(storyId) {
    try {
        const storybook = await window.firebaseService.getStorybookByStoryId(storyId);
        if (storybook && storybook.pages && storybook.pages.length > 0) {
            storybookPages = storybook.pages;
            currentPageIndex = 0;
            updateViewer();
            document.getElementById('storybookViewerModal').style.display = 'flex';
        } else {
            alert('제작된 동화책을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error("동화책 로딩 오류:", error);
        alert("동화책을 불러오는 중 오류가 발생했습니다.");
    }
}

function closeStorybookViewer() {
    document.getElementById('storybookViewerModal').style.display = 'none';
}

function updateViewer() {
    if(!storybookPages[currentPageIndex]) return;
    const page = storybookPages[currentPageIndex];
    const viewerImage = document.getElementById('viewerImage');
    const viewerText = document.getElementById('viewerText');
    const pageIndicator = document.getElementById('pageIndicator');
    const nextPageButton = document.getElementById('nextPageButton');

    if(viewerImage) viewerImage.src = page.image;
    if(viewerText) viewerText.textContent = page.text;
    if(pageIndicator) pageIndicator.textContent = `${currentPageIndex + 1} / ${storybookPages.length}`;

    if (nextPageButton) {
        if (currentPageIndex === storybookPages.length - 1) {
            nextPageButton.innerHTML = '처음으로 <i class="fas fa-redo"></i>';
        } else {
            nextPageButton.innerHTML = '다음 <i class="fas fa-arrow-right"></i>';
        }
    }
}

function showPrevPage() {
    if (currentPageIndex > 0) {
        currentPageIndex--;
        updateViewer();
    }
}

function showNextPage() {
    if (currentPageIndex < storybookPages.length - 1) {
        currentPageIndex++;
    } else {
        currentPageIndex = 0; // 마지막 페이지에서 누르면 처음으로 이동
    }
    updateViewer();
}
