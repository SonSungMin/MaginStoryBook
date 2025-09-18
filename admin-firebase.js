// admin-firebase.js - Firebase 연동된 관리자 페이지 스크립트

let establishments = [];
let users = [];

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
        
        // 초기 데이터 로드
        await loadData();
        
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
    const name = establishmentNameInput.value.trim();
    const address = establishmentAddressInput.value.trim();
    const adminName = establishmentAdminNameInput.value.trim();
    const adminPwd = establishmentAdminPwdInput.value.trim();

    if (!name || !address || !adminName || !adminPwd) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    // Firebase 서비스 확인
    if (!window.firebaseService) {
        alert('Firebase 서비스가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
    }

    try {
        console.log('사용처 등록 시작:', { name, address, adminName });
        
        // 중복 확인
        const nameExists = await window.firebaseService.checkEstablishmentExists(name);
        if (nameExists) {
            alert('이미 존재하는 상호입니다.');
            return;
        }

        const userExists = await window.firebaseService.checkUserExists(adminName);
        if (userExists) {
            alert('사용처 관리자 이름(ID)이 이미 존재합니다. 다른 이름을 사용해주세요.');
            return;
        }

        // 사용처 생성
        const establishmentId = await window.firebaseService.createEstablishment({
            name,
            address,
            adminName,
            adminPwd
        });
        console.log('사용처 생성 완료:', establishmentId);

        // 사용처 관리자 계정 생성
        const userId = await window.firebaseService.createUser({
            name: adminName,
            password: adminPwd,
            role: 'director',
            establishmentId: establishmentId
        });
        console.log('관리자 계정 생성 완료:', userId);

        alert('사용처가 등록되었습니다!');
        
        // 폼 초기화
        establishmentNameInput.value = '';
        establishmentAddressInput.value = '';
        establishmentAdminNameInput.value = '';
        establishmentAdminPwdInput.value = '';
        
        // 데이터 새로고침 및 즉시 리스트 업데이트
        console.log('데이터 새로고침 시작...');
        await loadData();
        renderEstablishmentList();
        
        // 다른 섹션들도 업데이트
        renderEstablishmentOptions();
        renderMemberPermissionOptions();
        
        console.log('사용처 등록 완료');
        
    } catch (error) {
        console.error('사용처 등록 오류:', error);
        alert('사용처 등록 중 오류가 발생했습니다: ' + error.message);
    }
};

function renderEstablishmentList() {
    console.log('사용처 리스트 렌더링 시작:', establishments);
    establishmentList.innerHTML = '';
    
    if (establishments.length === 0) {
        const li = document.createElement('li');
        li.innerHTML = '<span class="item-info">등록된 사용처가 없습니다.</span>';
        li.style.color = '#999';
        li.style.textAlign = 'center';
        establishmentList.appendChild(li);
        console.log('사용처 없음');
        return;
    }
    
    establishments.forEach((est, index) => {
        console.log(`사용처 ${index + 1}:`, est);
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="item-info">
                <strong>${est.name || '이름 없음'}</strong> (${est.address || '주소 없음'})<br>
                관리자: ${est.adminName || '관리자 없음'} (ID: ${est.adminName || '없음'})
            </span>
            <button onclick="deleteEstablishment('${est.id}')"><i class="fas fa-trash"></i> 삭제</button>
        `;
        establishmentList.appendChild(li);
    });
    
    console.log('사용처 리스트 렌더링 완료:', establishments.length, '개');
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
