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
    // (이하 다른 시/도 데이터 추가 가능)
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

// DOM 요소 캐싱
const adminNavButtons = document.querySelectorAll('.admin-nav-button');
const adminSections = document.querySelectorAll('.admin-section');

const establishmentNameInput = document.getElementById('establishmentName');
const establishmentAddressInput = document.getElementById('establishmentAddress');
const establishmentAdminNameInput = document.getElementById('establishmentAdminName');
const establishmentAdminPwdInput = document.getElementById('establishmentAdminPwd');
const establishmentList = document.getElementById('establishmentList');

const memberEstablishmentSelect = document.getElementById('memberEstablishment');
const memberNameInput = document.getElementById('memberName');
const memberBirthdateInput = document.getElementById('memberBirthdate');
const memberPwdInput = document.getElementById('memberPwd');
const memberRoleSelect = document.getElementById('memberRole');
const memberList = document.getElementById('memberList');

const permissionMemberSelect = document.getElementById('permissionMemberSelect');
const permissionRoleSelect = document.getElementById('permissionRoleSelect');
const permissionList = document.getElementById('permissionList');

// 페이지 초기화 함수
window.initializeAdminPage = async function() {
    console.log('관리자 페이지 초기화 시작...');
    
    // Firebase 서비스 대기
    let retryCount = 0;
    while (!window.firebaseService && retryCount < 10) {
        console.log(`Firebase 서비스 대기 중... (${retryCount + 1}/10)`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retryCount++;
    }
    
    if (!window.firebaseService) {
        console.error('Firebase 서비스 로드 실패');
        alert('Firebase 서비스 로드에 실패했습니다. 페이지를 새로고침해주세요.');
        return;
    }

    try {
        console.log('Firebase 서비스 연결됨');

        initializeAddressOptions(); // 주소 옵션 초기화 함수 호출
        
        // 초기 데이터 로드
        await loadData();
        
        // 실시간 리스너 설정
        setupRealtimeListeners();
        
        // 이벤트 리스너 등록
        setupEventListeners();
        
        // 기본 섹션 활성화
        activateAdminSection('manage-establishments');
        
        console.log('관리자 페이지 초기화 완료');
        
        // 시스템 상태 확인
        const status = await window.firebaseService.getSystemStatus();
        console.log('시스템 상태:', status);
        
    } catch (error) {
        console.error('관리자 페이지 초기화 오류:', error);
        alert('페이지 로드 중 오류가 발생했습니다: ' + error.message);
    }
};

// 실시간 리스너 설정
function setupRealtimeListeners() {
    console.log('실시간 리스너 설정 중...');
    
    // 사용처 실시간 업데이트
    establishmentListener = window.firebaseService.setupEstablishmentListener((newEstablishments) => {
        console.log('사용처 실시간 업데이트 받음:', newEstablishments);
        establishments = newEstablishments;
        
        // 현재 활성화된 섹션이 사용처 관리라면 리스트 업데이트
        const activeSection = document.querySelector('.admin-section.active');
        if (activeSection && activeSection.id === 'manage-establishments') {
            renderEstablishmentList();
        }
        
        // 구성원 등록의 사용처 선택 옵션도 업데이트
        renderEstablishmentOptions();
    });
    
    // 사용자 실시간 업데이트
    userListener = window.firebaseService.setupUserListener((newUsers) => {
        console.log('사용자 실시간 업데이트 받음:', newUsers);
        users = newUsers;
        
        // 현재 활성화된 섹션에 따라 리스트 업데이트
        const activeSection = document.querySelector('.admin-section.active');
        if (activeSection) {
            if (activeSection.id === 'manage-members') {
                renderMemberList();
            } else if (activeSection.id === 'manage-permissions') {
                renderMemberPermissionOptions();
                renderPermissionList();
            }
        }
    });
    
    console.log('실시간 리스너 설정 완료');
}

// 페이지 언로드 시 리스너 정리
window.addEventListener('beforeunload', () => {
    if (establishmentListener) {
        establishmentListener();
        console.log('사용처 리스너 정리');
    }
    if (userListener) {
        userListener();
        console.log('사용자 리스너 정리');
    }
});

// 데이터 로드
async function loadData() {
    console.log('데이터 로드 시작...');
    try {
        if (!window.firebaseService) {
            console.error('Firebase 서비스가 없음');
            throw new Error('Firebase 서비스가 초기화되지 않았습니다.');
        }
        
        establishments = await window.firebaseService.getAllEstablishments();
        users = await window.firebaseService.getAllUsers();
        
        console.log('데이터 로드 완료:');
        console.log('- 사용처:', establishments.length, '개');
        console.log('- 사용자:', users.length, '명');
        console.log('사용처 데이터:', establishments);
        console.log('사용자 데이터:', users);
        
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        // 빈 배열로 초기화하여 에러 방지
        establishments = [];
        users = [];
        throw error;
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    adminNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            adminNavButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activateAdminSection(button.dataset.target);
        });
    });
}

// 섹션 전환 기능
function activateAdminSection(targetId) {
    adminSections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // 각 섹션 활성화 시 목록 갱신
        if (targetId === 'manage-establishments') {
            renderEstablishmentList();
        } else if (targetId === 'manage-members') {
            renderEstablishmentOptions();
            renderMemberList();
        } else if (targetId === 'manage-permissions') {
            renderMemberPermissionOptions();
            renderPermissionList();
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
    const phone = document.getElementById('establishmentPhone').value.trim(); // 대표 번호 값 가져오기
    const adminName = document.getElementById('establishmentAdminName').value.trim();
    const adminPwd = document.getElementById('establishmentAdminPwd').value.trim();

    // 대표 번호 필드 유효성 검사 추가
    if (!name || !sido || !sigungu || !addressDetail || !phone || !adminName || !adminPwd) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    try {
        // ... (기존 로직 동일)
        const nameExists = await window.firebaseService.checkEstablishmentExists(name);
        if (nameExists) {
            alert('이미 존재하는 교육기관명입니다.');
            return;
        }

        const userExists = await window.firebaseService.checkUserExists(adminName);
        if (userExists) {
            alert('관리자 이름(ID)이 이미 존재합니다. 다른 이름을 사용해주세요.');
            return;
        }
        
        const address = {
            sido: sido,
            sigungu: sigungu,
            detail: addressDetail
        };

        const establishmentId = await window.firebaseService.createEstablishment({
            name,
            address,
            phone, // 대표 번호 데이터 추가
            adminName,
            adminPwd
        });

        // ... (기존 로직 동일)

        alert('교육기관이 등록되었습니다!');
        
        // 폼 초기화
        document.getElementById('establishmentName').value = '';
        document.getElementById('establishmentSido').value = '';
        document.getElementById('establishmentSigungu').innerHTML = '<option value="">-- 시/군/구 선택 --</option>';
        document.getElementById('establishmentAddressDetail').value = '';
        document.getElementById('establishmentPhone').value = ''; // 대표 번호 필드 초기화
        document.getElementById('establishmentAdminName').value = '';
        document.getElementById('establishmentAdminPwd').value = '';
        
    } catch (error) {
        console.error('교육기관 등록 오류:', error);
        alert('교육기관 등록 중 오류가 발생했습니다: ' + error.message);
    }
};


function renderEstablishmentList() {
    const establishmentList = document.getElementById('establishmentList');
    establishmentList.innerHTML = '';
    
    if (establishments.length === 0) { /* ... (내용 동일) ... */ return; }
    
    establishments.forEach(est => {
        const li = document.createElement('li');
        const fullAddress = est.address ? `${est.address.sido} ${est.address.sigungu} ${est.address.detail}` : '주소 정보 없음';
        const phoneSpan = est.phone ? ` <span class="phone-number">(<i class="fas fa-phone-alt"></i> ${est.phone})</span>` : '';

        li.innerHTML = `
            <span class="item-info">
                <strong>${est.name || '이름 없음'}${phoneSpan}</strong>
                <span class="address-line"><i class="fas fa-map-marker-alt"></i> ${fullAddress}</span>
            </span>
            <span class="item-meta">
                관리자: ${est.adminName || '관리자 없음'}
            </span>
            <div class="button-group-list">
                <button class="btn-edit" onclick="openEditModal('${est.id}')"><i class="fas fa-pen"></i> 수정</button>
                <button onclick="deleteEstablishment('${est.id}')"><i class="fas fa-trash"></i> 삭제</button>
            </div>
        `;
        establishmentList.appendChild(li);
    });
}

window.deleteEstablishment = async function(id) {
    if (!confirm('정말 이 사용처를 삭제하시겠습니까? 관련 구성원도 모두 삭제됩니다.')) return;
    
    try {
        await window.firebaseService.deleteEstablishment(id);
        alert('사용처 및 관련 구성원이 삭제되었습니다.');
        
        // 데이터 새로고침
        await loadData();
        renderEstablishmentList();
        renderMemberPermissionOptions();
        renderMemberList();
        
    } catch (error) {
        console.error('사용처 삭제 오류:', error);
        alert('사용처 삭제 중 오류가 발생했습니다.');
    }
};

// ===================
// 2. 구성원 등록
// ===================

function renderEstablishmentOptions() {
    memberEstablishmentSelect.innerHTML = '<option value="">-- 사용처 선택 --</option>';
    establishments.forEach(est => {
        const option = document.createElement('option');
        option.value = est.id;
        option.textContent = est.name;
        memberEstablishmentSelect.appendChild(option);
    });
}

window.addMember = async function() {
    const establishmentId = memberEstablishmentSelect.value;
    const name = memberNameInput.value.trim();
    const birthdate = memberBirthdateInput.value;
    const password = memberPwdInput.value.trim();
    const role = memberRoleSelect.value;

    if (!establishmentId || !name || !birthdate || !password || !role) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    try {
        // 중복 확인 (같은 사용처 내에서)
        const userExists = await window.firebaseService.checkUserExists(name, establishmentId);
        if (userExists) {
            alert(`해당 사용처에 이미 '${name}'이라는 이름의 구성원이 있습니다.`);
            return;
        }

        // 구성원 생성
        await window.firebaseService.createUser({
            establishmentId,
            name,
            birthdate,
            password,
            role
        });

        alert('구성원이 등록되었습니다!');
        
        // 폼 초기화
        memberNameInput.value = '';
        memberBirthdateInput.value = '';
        memberPwdInput.value = '';
        memberRoleSelect.value = 'student';
        
        // 데이터 새로고침
        await loadData();
        renderMemberList();
        renderMemberPermissionOptions();
        
    } catch (error) {
        console.error('구성원 등록 오류:', error);
        alert('구성원 등록 중 오류가 발생했습니다.');
    }
};

function renderMemberList(filterEstId = null) {
    memberList.innerHTML = '';
    let filteredUsers = users.filter(u => u.role !== 'admin'); // 관리자 계정 제외
    
    if (filterEstId) {
        filteredUsers = filteredUsers.filter(u => u.establishmentId === filterEstId);
    }

    filteredUsers.forEach(user => {
        const establishment = establishments.find(est => est.id === user.establishmentId);
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="item-info">
                <strong>${user.name}</strong> (${user.role})<br>
                소속: ${establishment ? establishment.name : '알 수 없음'} / 생년월일: ${user.birthdate}
            </span>
            <button onclick="deleteMember('${user.id}')"><i class="fas fa-trash"></i> 삭제</button>
        `;
        memberList.appendChild(li);
    });
}

window.filterMembersByEstablishment = function() {
    const selectedEstId = memberEstablishmentSelect.value;
    renderMemberList(selectedEstId || null);
};

window.deleteMember = async function(id) {
    if (!confirm('정말 이 구성원을 삭제하시겠습니까?')) return;
    
    try {
        await window.firebaseService.deleteUser(id);
        alert('구성원이 삭제되었습니다.');
        
        // 데이터 새로고침
        await loadData();
        renderMemberList(memberEstablishmentSelect.value || null);
        renderMemberPermissionOptions();
        
    } catch (error) {
        console.error('구성원 삭제 오류:', error);
        alert('구성원 삭제 중 오류가 발생했습니다.');
    }
};

// ===================
// 3. 권한 관리
// ===================

function renderMemberPermissionOptions() {
    permissionMemberSelect.innerHTML = '<option value="">-- 구성원 선택 --</option>';
    
    // 전체 관리자(admin) 계정은 권한 변경 목록에서 제외
    users.filter(u => u.role !== 'admin').forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        const establishment = establishments.find(est => est.id === user.establishmentId);
        option.textContent = `${user.name} (${establishment ? establishment.name : ''}) - 현재: ${user.role}`;
        permissionMemberSelect.appendChild(option);
    });
}

window.updateMemberPermission = async function() {
    const userId = permissionMemberSelect.value;
    const newRole = permissionRoleSelect.value;

    if (!userId || !newRole) {
        alert('구성원과 새로운 권한을 선택해주세요.');
        return;
    }

    try {
        const user = users.find(u => u.id === userId);
        if (!user) {
            alert('구성원을 찾을 수 없습니다.');
            return;
        }

        await window.firebaseService.updateUserRole(userId, newRole);
        alert(`${user.name}님의 권한이 ${newRole}(으)로 변경되었습니다.`);
        
        // 데이터 새로고침
        await loadData();
        renderPermissionList();
        renderMemberPermissionOptions();
        
    } catch (error) {
        console.error('권한 변경 오류:', error);
        alert('권한 변경 중 오류가 발생했습니다.');
    }
};

function renderPermissionList() {
    permissionList.innerHTML = '';
    users.forEach(user => {
        const establishment = establishments.find(est => est.id === user.establishmentId);
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="item-info">
                <strong>${user.name}</strong> / 소속: ${establishment ? establishment.name : '글로벌'} / 권한: <strong>${user.role}</strong>
            </span>
        `;
        permissionList.appendChild(li);
    });
}

// DOM이 로드된 후 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
    console.log('관리자 페이지 DOM 로드 완료');
    // Firebase 서비스 로드를 기다린 후 initializeAdminPage가 호출됨
});
