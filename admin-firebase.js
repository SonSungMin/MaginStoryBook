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
const roleMap = {
    student: '원생',
    teacher: '선생님',
    director: '원장',
    admin: '관리자'
};

let establishments = [];
let users = [];
let classes = [];

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

export function updateSigunguOptions() {
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

export function initializeAdminPage() {
    console.log('관리자 페이지 초기화 시작...');
    
    document.getElementById('adminLoginButton').addEventListener('click', handleAdminLogin);
    
    const loggedInAdmin = sessionStorage.getItem('loggedInAdmin');
    if (loggedInAdmin) {
        document.getElementById('admin-login-container').style.display = 'none';
        document.getElementById('admin-main-content').style.display = 'block';
        document.getElementById('adminLogoutButton').addEventListener('click', handleAdminLogout);
        
        initializeAddressOptions();
        setupEventListeners();
        loadDataAndRender();
    } else {
        document.getElementById('admin-login-container').style.display = 'block';
        document.getElementById('admin-main-content').style.display = 'none';
    }
};

async function loadDataAndRender() {
    try {
        establishments = await window.firebaseService.getAllEstablishments();
        users = await window.firebaseService.getAllUsers();
        renderEstablishmentList();
        renderEstablishmentOptions();
        renderMemberList();
        renderMemberPermissionOptions();
        renderPermissionList();
        renderClassEstablishmentOptions();
    } catch (error) {
        console.error("데이터 로딩 및 렌더링 오류:", error);
    }
}

function setupEventListeners() {
    const adminNavButtons = document.querySelectorAll('.admin-nav-button');
    adminNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            adminNavButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activateAdminSection(button.dataset.target);
        });
    });
}

function activateAdminSection(targetId) {
    const adminSections = document.querySelectorAll('.admin-section');
    adminSections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

async function handleAdminLogin() {
    const id = document.getElementById('adminId').value.trim();
    const pwd = document.getElementById('adminPwd').value.trim();

    if (id === 'admin' && pwd === 'admin') {
        sessionStorage.setItem('loggedInAdmin', 'true');
        initializeAdminPage(); // 로그인 성공 후 페이지 재초기화
    } else {
        alert('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
}

function handleAdminLogout() {
    sessionStorage.removeItem('loggedInAdmin');
    location.reload();
}

export async function addEstablishment() {
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
        loadDataAndRender();
    } catch (error) {
        console.error('교육기관 등록 오류:', error);
        alert('교육기관 등록 중 오류가 발생했습니다: ' + error.message);
    }
}

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
    });
}

export async function deleteEstablishment(id) {
    if (!confirm('정말 이 교육기관를 삭제하시겠습니까? 관련 구성원도 모두 삭제됩니다.')) return;
    try {
        await window.firebaseService.deleteEstablishment(id);
        alert('교육기관 및 관련 구성원이 삭제되었습니다.');
        loadDataAndRender();
    } catch (error) {
        console.error('교육기관 삭제 오류:', error);
        alert('교육기관 삭제 중 오류가 발생했습니다.');
    }
}

export function renderClassEstablishmentOptions() {
    const classEstablishmentSelect = document.getElementById('classEstablishmentSelect');
    classEstablishmentSelect.innerHTML = '<option value="">-- 교육기관 선택 --</option>';
    establishments.forEach(est => {
        const option = document.createElement('option');
        option.value = est.id;
        option.textContent = est.name;
        classEstablishmentSelect.appendChild(option);
    });
}

export async function addClass() {
    const establishmentId = document.getElementById('classEstablishmentSelect').value;
    const name = document.getElementById('className').value.trim();

    if (!establishmentId || !name) {
        alert('교육기관을 선택하고 반 이름을 입력해주세요.');
        return;
    }

    try {
        await window.firebaseService.createClass({ establishmentId, name });
        alert('반이 등록되었습니다.');
        document.getElementById('className').value = '';
        renderClassList();
    } catch (error) {
        console.error("반 등록 오류:", error);
        alert("반 등록 중 오류가 발생했습니다.");
    }
}

export async function renderClassList() {
    const establishmentId = document.getElementById('classEstablishmentSelect').value;
    const classList = document.getElementById('classList');
    classList.innerHTML = '';

    if (!establishmentId) return;

    try {
        classes = await window.firebaseService.getClassesByEstablishment(establishmentId);
        classes.forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="item-content">
                    <div class="item-main-info">${c.name}</div>
                </div>
                <div class="item-actions">
                    <div class="button-group-list">
                        <button onclick="deleteClass('${c.id}')">삭제</button>
                    </div>
                </div>
            `;
            classList.appendChild(li);
        });
    } catch (error) {
        console.error("반 목록 로딩 오류:", error);
    }
}

export async function deleteClass(id) {
    if (!confirm('정말 이 반을 삭제하시겠습니까?')) return;
    try {
        await window.firebaseService.deleteClass(id);
        alert('반이 삭제되었습니다.');
        renderClassList();
    } catch (error) {
        console.error("반 삭제 오류:", error);
        alert("반 삭제 중 오류가 발생했습니다.");
    }
}

function renderEstablishmentOptions() {
    const memberEstablishmentSelect = document.getElementById('memberEstablishment');
    const currentVal = memberEstablishmentSelect.value;
    memberEstablishmentSelect.innerHTML = '<option value="">-- 교육기관 선택 --</option>';
    establishments.forEach(est => {
        const option = document.createElement('option');
        option.value = est.id;
        option.textContent = est.name;
        memberEstablishmentSelect.appendChild(option);
    });
    memberEstablishmentSelect.value = currentVal;
}

export async function addMember() {
    const establishmentId = document.getElementById('memberEstablishment').value;
    const name = document.getElementById('memberName').value.trim();
    const birthdate = document.getElementById('memberBirthdate').value;
    const password = document.getElementById('memberPwd').value.trim();
    const role = document.getElementById('memberRole').value;
    if (!establishmentId || !name || !birthdate || !password || !role) return alert('모든 필드를 입력해주세요.');
    try {
        const userExists = await window.firebaseService.checkUserExists(name, establishmentId);
        if (userExists) return alert(`해당 교육기관에 이미 '${name}'이라는 이름의 구성원이 있습니다.`);
        await window.firebaseService.createUser({ establishmentId, name, birthdate, password, role });
        alert('구성원이 등록되었습니다!');
        loadDataAndRender();
    } catch (error) {
        console.error('구성원 등록 오류:', error);
        alert('구성원 등록 중 오류가 발생했습니다.');
    }
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
    });
}

export function filterMembersByEstablishment() {
    renderMemberList(document.getElementById('memberEstablishment').value || null);
}

export async function deleteMember(id) {
    if (!confirm('정말 이 구성원을 삭제하시겠습니까?')) return;
    try {
        await window.firebaseService.deleteUser(id);
        alert('구성원이 삭제되었습니다.');
        loadDataAndRender();
    } catch (error) {
        console.error('구성원 삭제 오류:', error);
        alert('구성원 삭제 중 오류가 발생했습니다.');
    }
}

function renderMemberPermissionOptions() {
    const permissionMemberSelect = document.getElementById('permissionMemberSelect');
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
}

export async function updateMemberPermission() {
    const userId = document.getElementById('permissionMemberSelect').value;
    const newRole = document.getElementById('permissionRoleSelect').value;
    if (!userId || !newRole) return alert('구성원과 새로운 권한을 선택해주세요.');
    try {
        const user = users.find(u => u.id === userId);
        if (!user) return alert('구성원을 찾을 수 없습니다.');
        await window.firebaseService.updateUserRole(userId, newRole);
        alert(`${user.name}님의 권한이 ${roleMap[newRole]}(으)로 변경되었습니다.`);
        loadDataAndRender();
    } catch (error) {
        console.error('권한 변경 오류:', error);
        alert('권한 변경 중 오류가 발생했습니다.');
    }
}

function renderPermissionList() {
    const permissionList = document.getElementById('permissionList');
    permissionList.innerHTML = '';
    users.forEach(user => {
        const establishment = establishments.find(est => est.id === user.establishmentId);
        const li = document.createElement('li');
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

const editModal = document.getElementById('editEstablishmentModal');

export function openEditModal(id) {
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
    }
    sidoSelect.value = establishment.address.sido;
    updateEditSigunguOptions();
    document.getElementById('editEstablishmentSigungu').value = establishment.address.sigungu;
    document.getElementById('editEstablishmentAddressDetail').value = establishment.address.detail;
    editModal.style.display = 'flex';
}

export function closeEditModal() {
    editModal.style.display = 'none';
}

export function updateEditSigunguOptions() {
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
        });
    }
}

export async function saveEstablishmentChanges() {
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
        loadDataAndRender();
    } catch (error) {
        console.error('교육기관 정보 수정 오류:', error);
        alert('정보 수정 중 오류가 발생했습니다.');
    }
}

const editMemberModal = document.getElementById('editMemberModal');

export function openEditMemberModal(id) {
    const user = users.find(u => u.id === id);
    if (!user) return alert('구성원 정보를 찾을 수 없습니다.');
    document.getElementById('editMemberId').value = id;
    document.getElementById('editMemberName').value = user.name;
    document.getElementById('editMemberBirthdate').value = user.birthdate;
    editMemberModal.style.display = 'flex';
}

export function closeEditMemberModal() {
    editMemberModal.style.display = 'none';
}

export async function saveMemberChanges() {
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
        loadDataAndRender();
    } catch (error) {
        console.error('구성원 정보 수정 오류:', error);
        alert('정보 수정 중 오류가 발생했습니다.');
    }
}

export async function resetPassword(id) {
    const user = users.find(u => u.id === id);
    if (!user) return alert('구성원 정보를 찾을 수 없습니다.');
    if (!user.birthdate) return alert('생년월일 정보가 없어 비밀번호를 초기화할 수 없습니다.');
    if (!confirm(`${user.name}님의 비밀번호를 생년월일(YYYYMMDD)로 초기화하시겠습니까?`)) return;
    const newPassword = user.birthdate.replace(/-/g, '');
    try {
        await window.firebaseService.updateUser(id, { password: newPassword });
        alert(`비밀번호가 ${newPassword} (으)로 초기화되었습니다.`);
    } catch (error) {
        console.error('비밀번호 초기화 오류:', error);
        alert('비밀번호 초기화 중 오류가 발생했습니다.');
    }
}
