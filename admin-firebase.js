// admin-firebase.js - Firebase 연동된 관리자 페이지 스크립트

const addressData = {
    "서울특별시": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
    "부산광역시": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
    "대구광역시": ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
    "인천광역시": ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
    "광주광역시": ["광산구", "남구", "동구", "북구", "서구"],
    "대전광역시": ["대덕구", "동구", "서구", "유성구", "중구"],
    "울산광역시": ["남구", "동구", "북구", "울주군", "중구"],
    "세종특별자치시": ["세종시"],
    "경기도": ["수원시", "고양시", "용인시", "성남시", "부천시", "화성시", "안산시", "남양주시", "안양시", "평택시", "의정부시", "파주시", "시흥시", "김포시", "광명시", "광주시", "군포시", "하남시", "오산시", "이천시", "안성시", "의왕시", "양평군", "여주시", "동두천시", "과천시", "가평군", "연천군"],
};
// app-firebase.js - Firebase 연동된 메인 애플리케이션 스크립트

// 역할(Role) 한글 매핑 (전역으로 이동하여 모든 함수에서 사용)
const roleMap = {
    student: '원생',
    teacher: '선생님',
    director: '원장',
    admin: '관리자'
};

// 페이지가 로드될 때 '시/도' 드롭다운 메뉴를 채우는 함수
function initializeAddressOptions() {
    const sidoSelect = document.getElementById('establishmentSido');
    sidoSelect.innerHTML = '<option value="">-- 시/도 선택 --</option>';
    for (const sido in addressData) {
        const option = document.createElement('option');
        option.value = sido;
        option.textContent = sido;
        sidoSelect.appendChild(option);
    }
}

// '시/도' 선택 시 '시/군/구' 드롭다운 메뉴를 업데이트하는 함수
window.updateSigunguOptions = function() {
    const sidoSelect = document.getElementById('establishmentSido');
    const sigunguSelect = document.getElementById('establishmentSigungu');
    const selectedSido = sidoSelect.value;

    sigunguSelect.innerHTML = '<option value="">-- 시/군/구 선택 --</option>';
    if (selectedSido && addressData[selectedSido]) {
        addressData[selectedSido].forEach(sigungu => {
            const option = document.createElement('option');
            option.value = sigungu;
            option.textContent = sigungu;
            sigunguSelect.appendChild(option);
        });
    }
}

let establishments = [];
let users = [];
let establishmentListener = null;
let userListener = null;
let currentUser = null;
let myStories = [];
let classStories = [];

// DOM 요소 캐싱
const adminNavButtons = document.querySelectorAll('.admin-nav-button');
const adminSections = document.querySelectorAll('.admin-section');
const memberEstablishmentSelect = document.getElementById('memberEstablishment');
const permissionMemberSelect = document.getElementById('permissionMemberSelect');

// 페이지 초기화 함수
window.initializeAdminPage = async function() {
    console.log('관리자 페이지 초기화 시작...');
    
    let retryCount = 0;
    while (!window.firebaseService && retryCount < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retryCount++;
    }
    
    if (!window.firebaseService) {
        alert('Firebase 서비스 로드에 실패했습니다. 페이지를 새로고침해주세요.');
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
        initializeAddressOptions();
        await loadData();
        setupRealtimeListeners();
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
        activateAdminSection('manage-establishments');
        console.log('관리자 페이지 초기화 완료');
        await loadAndRenderStories();
        activateSection('my-story');

        console.log('앱 초기화 완료');
} catch (error) {
        console.error('관리자 페이지 초기화 오류:', error);
        alert('페이지 로드 중 오류가 발생했습니다: ' + error.message);
        console.error('앱 초기화 오류:', error);
        alert('앱 로드 중 오류가 발생했습니다.');
}
};

// 실시간 리스너 설정
function setupRealtimeListeners() {
    establishmentListener = window.firebaseService.setupEstablishmentListener((newEstablishments) => {
        establishments = newEstablishments;
        const activeSectionId = document.querySelector('.admin-section.active')?.id;
        if (activeSectionId === 'manage-establishments') renderEstablishmentList();
        renderEstablishmentOptions(); // 항상 교육기관 목록을 최신으로 유지
    });
    
    userListener = window.firebaseService.setupUserListener((newUsers) => {
        users = newUsers;
        const activeSectionId = document.querySelector('.admin-section.active')?.id;
        if (activeSectionId === 'manage-members') renderMemberList();
        if (activeSectionId === 'manage-permissions') {
            renderMemberPermissionOptions();
            renderPermissionList();
async function loadAndRenderStories() {
    try {
        myStories = await window.firebaseService.getStoriesByUser(currentUser.id);
        classStories = await window.firebaseService.getStoriesByEstablishment(currentUser.establishmentId);
        renderMyStoryCards();
        renderClassStoryCards();
        if (['teacher', 'director', 'admin'].includes(currentUser.role)) {
            renderTeacherArtworkList();
}
    });
    } catch (error) {
        console.error('작품 로드 및 렌더링 오류:', error);
        myStories = [];
        classStories = [];
    }
}


window.addEventListener('beforeunload', () => {
    if (establishmentListener) establishmentListener();
    if (userListener) userListener();
});

async function loadData() {
    try {
        establishments = await window.firebaseService.getAllEstablishments();
        users = await window.firebaseService.getAllUsers();
    } catch (error) {
        establishments = [];
        users = [];
        throw error;
function setupUIByRole() {
    const teacherToolsNavButton = document.getElementById('teacherToolsNavButton');
    if (['teacher', 'director', 'admin'].includes(currentUser.role)) {
        teacherToolsNavButton.style.display = 'flex';
    } else {
        teacherToolsNavButton.style.display = 'none';
}
}

function setupEventListeners() {
    adminNavButtons.forEach(button => {
    navButtons.forEach(button => {
button.addEventListener('click', () => {
            adminNavButtons.forEach(btn => btn.classList.remove('active'));
            navButtons.forEach(btn => btn.classList.remove('active'));
button.classList.add('active');
            activateAdminSection(button.dataset.target);
            activateSection(button.dataset.target);
});
});

    seasonCalendarButton.addEventListener('click', () => {
        navButtons.forEach(btn => btn.classList.remove('active'));
        activateSection(seasonCalendarButton.dataset.target);
    });
    setupDragAndDrop();
}

function activateAdminSection(targetId) {
    adminSections.forEach(section => section.classList.remove('active'));
function activateSection(targetId) {
    appSections.forEach(section => section.classList.remove('active'));
const targetSection = document.getElementById(targetId);
if (targetSection) {
targetSection.classList.add('active');
        if (targetId === 'manage-establishments') renderEstablishmentList();
        if (targetId === 'manage-members') {
            renderEstablishmentOptions();
            renderMemberList();
        }
        if (targetId === 'manage-permissions') {
            renderMemberPermissionOptions();
            renderPermissionList();
        if (targetId === 'teacher-tools' && !['teacher', 'director', 'admin'].includes(currentUser.role)) {
             alert('선생님 도구함에 접근할 권한이 없습니다.');
             activateSection('my-story');
             document.querySelector('.nav-button[data-target="my-story"]').classList.add('active');
}
}
}

// ===================
// 1. 사용처 관리
// ===================
window.addEstablishment = async function() {
    const name = document.getElementById('establishmentName').value.trim();
    const sido = document.getElementById('establishmentSido').value;
    const sigungu = document.getElementById('establishmentSigungu').value;
    const addressDetail = document.getElementById('establishmentAddressDetail').value.trim();
    const phone = document.getElementById('establishmentPhone').value.trim();
    const adminName = document.getElementById('establishmentAdminName').value.trim();
    const adminPwd = document.getElementById('establishmentAdminPwd').value.trim();

    if (!name || !sido || !sigungu || !addressDetail || !phone || !adminName || !adminPwd) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    try {
        const nameExists = await window.firebaseService.checkEstablishmentExists(name);
        if (nameExists) return alert('이미 존재하는 교육기관명입니다.');
        const userExists = await window.firebaseService.checkUserExists(adminName);
        if (userExists) return alert('관리자 이름(ID)이 이미 존재합니다.');
        const address = { sido, sigungu, detail: addressDetail };
        const establishmentId = await window.firebaseService.createEstablishment({ name, address, phone, adminName, adminPwd });
        await window.firebaseService.createUser({ name: adminName, password: adminPwd, role: 'director', establishmentId });
        alert('교육기관이 등록되었습니다!');
        document.getElementById('establishmentName').value = '';
        document.getElementById('establishmentSido').value = '';
        document.getElementById('establishmentSigungu').innerHTML = '<option value="">-- 시/군/구 선택 --</option>';
        document.getElementById('establishmentAddressDetail').value = '';
        document.getElementById('establishmentPhone').value = '';
        document.getElementById('establishmentAdminName').value = '';
        document.getElementById('establishmentAdminPwd').value = '';
    } catch (error) {
        console.error('교육기관 등록 오류:', error);
        alert('교육기관 등록 중 오류가 발생했습니다: ' + error.message);
    }
window.handleLogout = function() {
    sessionStorage.removeItem('loggedInUser');
    alert('로그아웃되었습니다.');
    window.location.href = 'index.html';
};

function renderEstablishmentList() {
    const establishmentList = document.getElementById('establishmentList');
    establishmentList.innerHTML = '';
    establishments.forEach(est => {
        const li = document.createElement('li');
        const fullAddress = est.address ? `${est.address.sido} ${est.address.sigungu} ${est.address.detail}` : '주소 정보 없음';
        const phoneSpan = est.phone ? `(${est.phone})` : '';
        li.innerHTML = `
            <div class="item-content">
                <div class="item-main-info">${est.name || '이름 없음'} <span>${phoneSpan}</span></div>
                <div class="item-sub-info">
                    <span>${fullAddress}</span>
                    <span>관리자 : ${est.adminName || '없음'}</span>
                </div>
            </div>
            <div class="item-actions">
                <div class="button-group-list">
                    <button class="btn-edit" onclick="openEditModal('${est.id}')">수정</button>
                    <button onclick="deleteEstablishment('${est.id}')">삭제</button>
                </div>
            </div>
        `;
        establishmentList.appendChild(li);
function renderMyStoryCards() {
    const uploadCard = myStoryGrid.querySelector('.upload-card');
    myStoryGrid.innerHTML = '';
    myStoryGrid.appendChild(uploadCard);
    myStories.forEach(story => {
        const storyCard = createStoryCardElement(story);
        myStoryGrid.appendChild(storyCard);
});
}

window.deleteEstablishment = async function(id) {
    if (!confirm('정말 이 사용처를 삭제하시겠습니까? 관련 구성원도 모두 삭제됩니다.')) return;
    try {
        await window.firebaseService.deleteEstablishment(id);
        alert('사용처 및 관련 구성원이 삭제되었습니다.');
    } catch (error) {
        console.error('사용처 삭제 오류:', error);
        alert('사용처 삭제 중 오류가 발생했습니다.');
    }
};

// ===================
// 2. 구성원 등록
// ===================
function renderEstablishmentOptions() {
    const currentVal = memberEstablishmentSelect.value;
    memberEstablishmentSelect.innerHTML = '<option value="">-- 교육기관 선택 --</option>';
    establishments.forEach(est => {
        const option = document.createElement('option');
        option.value = est.id;
        option.textContent = est.name;
        memberEstablishmentSelect.appendChild(option);
function renderClassStoryCards() {
    classStoryGrid.innerHTML = '';
    classStories.forEach(story => {
        const storyCard = createStoryCardElement(story);
        classStoryGrid.appendChild(storyCard);
});
    memberEstablishmentSelect.value = currentVal;
}

window.addMember = async function() {
    const establishmentId = memberEstablishmentSelect.value;
    const name = document.getElementById('memberName').value.trim();
    const birthdate = document.getElementById('memberBirthdate').value;
    const password = document.getElementById('memberPwd').value.trim();
    const role = document.getElementById('memberRole').value;
    if (!establishmentId || !name || !birthdate || !password || !role) return alert('모든 필드를 입력해주세요.');
    try {
        const userExists = await window.firebaseService.checkUserExists(name, establishmentId);
        if (userExists) return alert(`해당 사용처에 이미 '${name}'이라는 이름의 구성원이 있습니다.`);
        await window.firebaseService.createUser({ establishmentId, name, birthdate, password, role });
        alert('구성원이 등록되었습니다!');
        document.getElementById('memberName').value = '';
        document.getElementById('memberBirthdate').value = '';
        document.getElementById('memberPwd').value = '';
        document.getElementById('memberRole').value = 'student';
    } catch (error) {
        console.error('구성원 등록 오류:', error);
        alert('구성원 등록 중 오류가 발생했습니다.');
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
};
    return storyCard;
}

function renderMemberList(filterEstId = null) {
    const memberList = document.getElementById('memberList');
    memberList.innerHTML = '';
    let filteredUsers = users.filter(u => u.role !== 'admin');
    if (filterEstId) {
        filteredUsers = filteredUsers.filter(u => u.establishmentId === filterEstId);
    }
    filteredUsers.forEach(user => {
        const establishment = establishments.find(est => est.id === user.establishmentId);
        const li = document.createElement('li');
        const userRoleKorean = roleMap[user.role] || user.role;
        li.innerHTML = `
            <div class="item-content">
                <div class="item-main-info">${user.name} <span>(${userRoleKorean})</span></div>
                <div class="item-sub-info">
                    <span>${establishment ? establishment.name : '알 수 없음'} / ${user.birthdate}</span>
                </div>
            </div>
            <div class="item-actions">
                <div class="button-group-list">
                    <button class="btn-reset-pwd" onclick="resetPassword('${user.id}')">초기화</button>
                    <button class="btn-edit" onclick="openEditMemberModal('${user.id}')">수정</button>
                    <button onclick="deleteMember('${user.id}')">삭제</button>
                </div>
            </div>
        `;
        memberList.appendChild(li);

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

window.filterMembersByEstablishment = function() {
    renderMemberList(memberEstablishmentSelect.value || null);

window.openUploadModal = function() {
    uploadModal.style.display = 'flex';
    drawingFileInput.value = '';
    document.getElementById('cameraInput').value = '';
    previewImage.src = 'images/placeholder_preview.png';
    drawingTitleInput.value = '';
    drawingStoryInput.value = '';
    currentOriginalFile = null;
};

window.deleteMember = async function(id) {
    if (!confirm('정말 이 구성원을 삭제하시겠습니까?')) return;
    try {
        await window.firebaseService.deleteUser(id);
        alert('구성원이 삭제되었습니다.');
    } catch (error) {
        console.error('구성원 삭제 오류:', error);
        alert('구성원 삭제 중 오류가 발생했습니다.');
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

// ===================
// 3. 권한 관리
// ===================
function renderMemberPermissionOptions() {
    const currentVal = permissionMemberSelect.value;
    permissionMemberSelect.innerHTML = '<option value="">-- 구성원 선택 --</option>';
    users.filter(u => u.role !== 'admin').forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        const establishment = establishments.find(est => est.id === user.establishmentId);
        const userRoleKorean = roleMap[user.role] || user.role;
        option.textContent = `${user.name} (${establishment ? establishment.name : ''}) - 현재: ${userRoleKorean}`;
        permissionMemberSelect.appendChild(option);
    });
    permissionMemberSelect.value = currentVal;
function closeCropModal() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    cropModal.style.display = 'none';
    imageToCrop.src = "";
}

window.updateMemberPermission = async function() {
    const userId = permissionMemberSelect.value;
    const newRole = document.getElementById('permissionRoleSelect').value;
    if (!userId || !newRole) return alert('구성원과 새로운 권한을 선택해주세요.');
    try {
        const user = users.find(u => u.id === userId);
        if (!user) return alert('구성원을 찾을 수 없습니다.');
        await window.firebaseService.updateUserRole(userId, newRole);
        alert(`${user.name}님의 권한이 ${roleMap[newRole]}(으)로 변경되었습니다.`);
    } catch (error) {
        console.error('권한 변경 오류:', error);
        alert('권한 변경 중 오류가 발생했습니다.');
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

function renderPermissionList() {
    const permissionList = document.getElementById('permissionList');
    permissionList.innerHTML = '';
    users.forEach(user => {
        const establishment = establishments.find(est => est.id === user.establishmentId);
        const li = document.createElement('li');
        // '구성원 권한 현황' 항목에만 특별한 클래스 부여
        li.classList.add('permission-item'); 
        const userRoleKorean = roleMap[user.role] || user.role;
        li.innerHTML = `
            <div class="item-content">
                <div class="item-main-info">
                    <span>${user.name} (${userRoleKorean})</span>
                    <div class="item-actions">
                        <div class="button-group-list">
                            <button class="btn-edit" onclick="openEditMemberModal('${user.id}')">수정</button>
                            <button onclick="deleteMember('${user.id}')">삭제</button>
                        </div>
                    </div>
                </div>
                <div class="item-sub-info">
                    <span>소속: ${establishment ? establishment.name : '글로벌'}</span>
                </div>
            </div>
        `;
        permissionList.appendChild(li);
    });
}
window.cancelCrop = function() {
    closeCropModal();
};

window.saveStory = async function() {
    const title = drawingTitleInput.value.trim();
    const storyText = drawingStoryInput.value.trim();

// ===================
// 4. 교육기관 수정
// ===================
const editModal = document.getElementById('editEstablishmentModal');

function openEditModal(id) {
    const establishment = establishments.find(est => est.id === id);
    if (!establishment) return alert('교육기관 정보를 찾을 수 없습니다.');
    document.getElementById('editEstablishmentId').value = id;
    document.getElementById('editEstablishmentName').value = establishment.name;
    document.getElementById('editEstablishmentPhone').value = establishment.phone || '';
    const sidoSelect = document.getElementById('editEstablishmentSido');
    sidoSelect.innerHTML = '<option value="">-- 시/도 선택 --</option>';
    for (const sido in addressData) {
        const option = document.createElement('option');
        option.value = sido;
        option.textContent = sido;
        sidoSelect.appendChild(option);
    if (!currentOriginalFile || !title) {
        alert('그림을 업로드하고 제목을 입력해주세요!');
        return;
}
    sidoSelect.value = establishment.address.sido;
    updateEditSigunguOptions();
    document.getElementById('editEstablishmentSigungu').value = establishment.address.sigungu;
    document.getElementById('editEstablishmentAddressDetail').value = establishment.address.detail;
    editModal.style.display = 'flex';
}

function closeEditModal() {
    editModal.style.display = 'none';
}

function updateEditSigunguOptions() {
    const sidoSelect = document.getElementById('editEstablishmentSido');
    const sigunguSelect = document.getElementById('editEstablishmentSigungu');
    const selectedSido = sidoSelect.value;
    sigunguSelect.innerHTML = '<option value="">-- 시/군/구 선택 --</option>';
    if (selectedSido && addressData[selectedSido]) {
        addressData[selectedSido].forEach(sigungu => {
            const option = document.createElement('option');
            option.value = sigungu;
            option.textContent = sigungu;
            sigunguSelect.appendChild(option);
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
    }
}

async function saveEstablishmentChanges() {
    const id = document.getElementById('editEstablishmentId').value;
    const name = document.getElementById('editEstablishmentName').value.trim();
    const phone = document.getElementById('editEstablishmentPhone').value.trim();
    const sido = document.getElementById('editEstablishmentSido').value;
    const sigungu = document.getElementById('editEstablishmentSigungu').value;
    const detail = document.getElementById('editEstablishmentAddressDetail').value.trim();
    if (!name || !phone || !sido || !sigungu || !detail) return alert('모든 필드를 입력해주세요.');
    const updateData = { name, phone, address: { sido, sigungu, detail } };
    try {
        await window.firebaseService.updateEstablishment(id, updateData);
        alert('교육기관 정보가 성공적으로 수정되었습니다.');
        closeEditModal();
        alert('그림이 저장되었습니다!');
        closeUploadModal();
        await loadAndRenderStories();
} catch (error) {
        console.error('교육기관 정보 수정 오류:', error);
        alert('정보 수정 중 오류가 발생했습니다.');
        console.error('작품 저장 오류:', error);
        alert('작품 저장 중 오류가 발생했습니다.');
}
}
};

// ===================
// 5. 구성원 수정 및 비밀번호 초기화
// ===================
const editMemberModal = document.getElementById('editMemberModal');

function openEditMemberModal(id) {
    const user = users.find(u => u.id === id);
    if (!user) return alert('구성원 정보를 찾을 수 없습니다.');
    document.getElementById('editMemberId').value = id;
    document.getElementById('editMemberName').value = user.name;
    document.getElementById('editMemberBirthdate').value = user.birthdate;
    editMemberModal.style.display = 'flex';
}
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

function closeEditMemberModal() {
    editMemberModal.style.display = 'none';
}
window.closeEditStoryModal = function() {
    editStoryModal.style.display = 'none';
};

async function saveMemberChanges() {
    const id = document.getElementById('editMemberId').value;
    const name = document.getElementById('editMemberName').value.trim();
    const birthdate = document.getElementById('editMemberBirthdate').value;
    if (!name || !birthdate) return alert('모든 필드를 입력해주세요.');
    const currentUser = users.find(u => u.id === id);
    const isNameDuplicate = users.some(user => user.id !== id && user.establishmentId === currentUser.establishmentId && user.name === name);
    if (isNameDuplicate) return alert('해당 교육기관에 이미 같은 이름의 구성원이 존재합니다.');
    const updateData = { name, birthdate };
    try {
        await window.firebaseService.updateUser(id, updateData);
        alert('구성원 정보가 성공적으로 수정되었습니다.');
        closeEditMemberModal();
    } catch (error) {
        console.error('구성원 정보 수정 오류:', error);
        alert('정보 수정 중 오류가 발생했습니다.');
window.saveStoryChanges = async function() {
    const storyId = editStoryIdInput.value;
    const newTitle = editDrawingTitleInput.value.trim();
    const newStoryText = editDrawingStoryInput.value.trim();

    if (!newTitle) {
        alert('제목을 입력해주세요.');
        return;
}
}

async function resetPassword(id) {
    const user = users.find(u => u.id === id);
    if (!user) return alert('구성원 정보를 찾을 수 없습니다.');
    if (!user.birthdate) return alert('생년월일 정보가 없어 비밀번호를 초기화할 수 없습니다.');
    if (!confirm(`${user.name}님의 비밀번호를 생년월일(YYYYMMDD)로 초기화하시겠습니까?`)) return;
    const newPassword = user.birthdate.replace(/-/g, '');
try {
        await window.firebaseService.updateUser(id, { password: newPassword });
        alert(`비밀번호가 ${newPassword} (으)로 초기화되었습니다.`);
        await window.firebaseService.updateStory(storyId, {
            title: newTitle,
            storyText: newStoryText
        });
        alert('작품 정보가 수정되었습니다.');
        closeEditStoryModal();
        await loadAndRenderStories();
} catch (error) {
        console.error('비밀번호 초기화 오류:', error);
        alert('비밀번호 초기화 중 오류가 발생했습니다.');
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
