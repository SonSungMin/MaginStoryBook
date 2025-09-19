// admin-firebase.js

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

export function initializeAdminPage() {
    console.log('관리자 페이지 초기화 시작...');

    window.openEditModal = openEditModal;
    window.deleteEstablishment = deleteEstablishment;
    window.openEditThemeModal = openEditThemeModal;
    window.activateTheme = activateTheme; // 활성화 함수 전역 등록
    window.deleteTheme = deleteTheme;
    window.deleteClass = deleteClass;
    window.openEditMemberModal = openEditMemberModal;
    window.deleteMember = deleteMember;
    window.resetPassword = resetPassword;
    window.handleRoleChange = handleRoleChange; 

    document.getElementById('adminLoginButton').addEventListener('click', handleAdminLogin);
    document.getElementById('adminLogoutButton').addEventListener('click', handleAdminLogout);
    
    document.querySelectorAll('.admin-nav-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.admin-nav-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activateAdminSection(button.dataset.target);
        });
    });

    document.getElementById('addEstablishmentButton').addEventListener('click', addEstablishment);
    document.getElementById('addClassButton').addEventListener('click', addClass);
    document.getElementById('addThemeButton').addEventListener('click', addTheme);
    document.getElementById('addMemberButton').addEventListener('click', addMember);
    document.getElementById('updateMemberPermissionButton').addEventListener('click', updateMemberPermission);

    document.getElementById('saveEstablishmentChangesButton').addEventListener('click', saveEstablishmentChanges);
    document.getElementById('closeEditEstablishmentModalButton').addEventListener('click', closeEditModal);
    document.getElementById('cancelEditEstablishmentButton').addEventListener('click', closeEditModal);

    document.getElementById('saveThemeChangesButton').addEventListener('click', saveThemeChanges);
    document.getElementById('closeEditThemeModalButton').addEventListener('click', closeEditThemeModal);
    document.getElementById('cancelEditThemeButton').addEventListener('click', closeEditThemeModal);
    
    document.getElementById('saveMemberChangesButton').addEventListener('click', saveMemberChanges);
    document.getElementById('closeEditMemberModalButton').addEventListener('click', closeEditMemberModal);
    document.getElementById('cancelEditMemberButton').addEventListener('click', closeEditMemberModal);

    document.getElementById('establishmentSido').addEventListener('change', updateSigunguOptions);
    document.getElementById('editEstablishmentSido').addEventListener('change', updateEditSigunguOptions);
    document.getElementById('classEstablishmentSelect').addEventListener('change', renderClassList);
    document.getElementById('themeEstablishmentSelect').addEventListener('change', renderThemeList);
    document.getElementById('memberEstablishment').addEventListener('change', () => {
        filterMembersByEstablishment();
        updateMemberClassOptions();
    });

    initializeAddressOptions();
    checkAdminLoginState();
}

function checkAdminLoginState() {
    if (sessionStorage.getItem('loggedInAdmin')) {
        document.getElementById('admin-login-container').style.display = 'none';
        document.getElementById('admin-main-content').style.display = 'block';
        loadDataAndRender();
    } else {
        document.getElementById('admin-login-container').style.display = 'block';
        document.getElementById('admin-main-content').style.display = 'none';
    }
}

async function loadDataAndRender() {
    try {
        [establishments, users] = await Promise.all([
            window.firebaseService.getAllEstablishments(),
            window.firebaseService.getAllUsers()
        ]);
        await renderAll();
    } catch (error) {
        console.error("데이터 로딩 및 렌더링 오류:", error);
    }
}

async function renderAll() {
    renderEstablishmentList();
    renderEstablishmentOptions();
    renderClassEstablishmentOptions();
    renderThemeEstablishmentOptions();
    await renderMemberList();
    renderMemberPermissionOptions();
    renderPermissionList();
    if(document.getElementById('classEstablishmentSelect').value) {
        await renderClassList();
    }
    if(document.getElementById('themeEstablishmentSelect').value) {
        await renderThemeList();
    }
}

function handleAdminLogin() {
    const id = document.getElementById('adminId').value.trim();
    const pwd = document.getElementById('adminPwd').value.trim();
    if (id === 'admin' && pwd === 'admin') {
        sessionStorage.setItem('loggedInAdmin', 'true');
        checkAdminLoginState();
    } else {
        alert('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
}

function handleAdminLogout() {
    sessionStorage.removeItem('loggedInAdmin');
    window.location.href = 'index.html';
}

function activateAdminSection(targetId) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(targetId).classList.add('active');
}

function initializeAddressOptions() {
    const sidoSelect = document.getElementById('establishmentSido');
    sidoSelect.innerHTML = '<option value="">-- 시/도 선택 --</option>';
    for (const sido in addressData) {
        sidoSelect.innerHTML += `<option value="${sido}">${sido}</option>`;
    }
}

function updateSigunguOptions() {
    const sidoSelect = document.getElementById('establishmentSido');
    const sigunguSelect = document.getElementById('establishmentSigungu');
    const selectedSido = sidoSelect.value;
    sigunguSelect.innerHTML = '<option value="">-- 시/군/구 선택 --</option>';
    if (selectedSido && addressData[selectedSido]) {
        addressData[selectedSido].forEach(sigungu => {
            sigunguSelect.innerHTML += `<option value="${sigungu}">${sigungu}</option>`;
        });
    }
}

function updateEditSigunguOptions() {
    const sidoSelect = document.getElementById('editEstablishmentSido');
    const sigunguSelect = document.getElementById('editEstablishmentSigungu');
    const selectedSido = sidoSelect.value;
    sigunguSelect.innerHTML = '<option value="">-- 시/군/구 선택 --</option>';
    if (selectedSido && addressData[selectedSido]) {
        addressData[selectedSido].forEach(sigungu => {
            sigunguSelect.innerHTML += `<option value="${sigungu}">${sigungu}</option>`;
        });
    }
}

async function addEstablishment() {
    const name = document.getElementById('establishmentName').value.trim();
    const sido = document.getElementById('establishmentSido').value;
    const sigungu = document.getElementById('establishmentSigungu').value;
    const addressDetail = document.getElementById('establishmentAddressDetail').value.trim();
    const phone = document.getElementById('establishmentPhone').value.trim();
    const adminName = document.getElementById('establishmentAdminName').value.trim();
    const adminPwd = document.getElementById('establishmentAdminPwd').value.trim();

    if (!name || !sido || !sigungu || !addressDetail || !phone || !adminName || !adminPwd) {
        return alert('모든 필드를 입력해주세요.');
    }
    try {
        if (await window.firebaseService.checkEstablishmentExists(name)) return alert('이미 존재하는 교육기관명입니다.');
        if (await window.firebaseService.checkUserExists(adminName)) return alert('관리자 이름(ID)이 이미 존재합니다.');
        
        const address = { sido, sigungu, detail: addressDetail };
        const establishmentId = await window.firebaseService.createEstablishment({ name, address, phone, adminName });
        await window.firebaseService.createUser({ name: adminName, password: adminPwd, role: 'director', establishmentId });
        
        alert('교육기관이 등록되었습니다!');
        await loadDataAndRender();
    } catch (error) {
        console.error('교육기관 등록 오류:', error);
        alert('교육기관 등록 중 오류가 발생했습니다.');
    }
}

function renderEstablishmentList() {
    const listElement = document.getElementById('establishmentList');
    listElement.innerHTML = '';
    establishments.forEach(est => {
        const fullAddress = est.address ? `${est.address.sido} ${est.address.sigungu} ${est.address.detail}` : '주소 정보 없음';
        const phoneSpan = est.phone ? `(${est.phone})` : '';
        const li = document.createElement('li');
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
        listElement.appendChild(li);
    });
}

async function deleteEstablishment(id) {
    if (!confirm('정말 이 교육기관을 삭제하시겠습니까? 관련 구성원, 반, 테마 정보가 모두 삭제됩니다.')) return;
    try {
        await window.firebaseService.deleteEstablishment(id);
        alert('교육기관 및 관련 데이터가 삭제되었습니다.');
        await loadDataAndRender();
    } catch (error) {
        console.error('교육기관 삭제 오류:', error);
        alert('교육기관 삭제 중 오류가 발생했습니다.');
    }
}

function renderClassEstablishmentOptions() {
    const select = document.getElementById('classEstablishmentSelect');
    select.innerHTML = '<option value="">-- 교육기관 선택 --</option>';
    establishments.forEach(est => {
        select.innerHTML += `<option value="${est.id}">${est.name}</option>`;
    });
}
function renderThemeEstablishmentOptions() {
    const select = document.getElementById('themeEstablishmentSelect');
    select.innerHTML = '<option value="">-- 교육기관 선택 --</option>';
    establishments.forEach(est => {
        select.innerHTML += `<option value="${est.id}">${est.name}</option>`;
    });
}

async function addClass() {
    const establishmentId = document.getElementById('classEstablishmentSelect').value;
    const name = document.getElementById('className').value.trim();
    if (!establishmentId || !name) return alert('교육기관을 선택하고 반 이름을 입력해주세요.');
    
    try {
        await window.firebaseService.createClass({ establishmentId, name });
        alert('반이 등록되었습니다.');
        document.getElementById('className').value = '';
        await renderClassList();
    } catch (error) {
        console.error("반 등록 오류:", error);
        alert("반 등록 중 오류가 발생했습니다.");
    }
}

async function renderClassList() {
    const establishmentId = document.getElementById('classEstablishmentSelect').value;
    const listElement = document.getElementById('classList');
    listElement.innerHTML = '';
    if (!establishmentId) return;

    try {
        const classList = await window.firebaseService.getClassesByEstablishment(establishmentId);
        classList.forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="item-content"><div class="item-main-info">${c.name}</div></div>
                <div class="item-actions">
                    <div class="button-group-list"><button onclick="deleteClass('${c.id}')">삭제</button></div>
                </div>`;
            listElement.appendChild(li);
        });
    } catch (error) {
        console.error("반 목록 로딩 오류:", error);
        listElement.innerHTML = '<li>반 목록을 불러오는 데 실패했습니다.</li>';
    }
}

async function deleteClass(id) {
    if (!confirm('정말 이 반을 삭제하시겠습니까?')) return;
    try {
        await window.firebaseService.deleteClass(id);
        alert('반이 삭제되었습니다.');
        await renderClassList();
    } catch (error) {
        console.error("반 삭제 오류:", error);
        alert("반 삭제 중 오류가 발생했습니다.");
    }
}
async function addTheme() {
    const establishmentId = document.getElementById('themeEstablishmentSelect').value;
    const name = document.getElementById('themeName').value.trim();
    if (!establishmentId || !name) return alert('교육기관을 선택하고 테마 이름을 입력해주세요.');
    
    try {
        await window.firebaseService.createTheme({ establishmentId, name });
        alert('테마가 등록되었습니다.');
        document.getElementById('themeName').value = '';
        await renderThemeList();
    } catch (error) {
        console.error("테마 등록 오류:", error);
        alert("테마 등록 중 오류가 발생했습니다.");
    }
}

async function renderThemeList() {
    const establishmentId = document.getElementById('themeEstablishmentSelect').value;
    const listElement = document.getElementById('themeList');
    listElement.innerHTML = '';
    if (!establishmentId) return;

    try {
        const themeList = await window.firebaseService.getThemesByEstablishment(establishmentId);
        themeList.forEach(t => {
            const li = document.createElement('li');
            const activeClass = t.isActive ? 'active' : '';
            const buttonText = t.isActive ? '활성중' : '활성화';
            li.innerHTML = `
                <div class="item-content"><div class="item-main-info">${t.name}</div></div>
                <div class="item-actions">
                    <div class="button-group-list">
                        <button class="btn-activate ${activeClass}" onclick="activateTheme('${t.establishmentId}', '${t.id}')">${buttonText}</button>
                        <button class="btn-edit" onclick="openEditThemeModal('${t.id}', '${t.name}')">수정</button>
                        <button onclick="deleteTheme('${t.id}')">삭제</button>
                    </div>
                </div>`;
            listElement.appendChild(li);
        });
    } catch (error) {
        console.error("테마 목록 로딩 오류:", error);
        listElement.innerHTML = '<li>테마 목록을 불러오는 데 실패했습니다.</li>';
    }
}

async function activateTheme(establishmentId, themeId) {
    try {
        await window.firebaseService.updateThemeActivation(establishmentId, themeId);
        alert('테마가 활성화되었습니다.');
        await renderThemeList();
    } catch (error) {
        console.error('테마 활성화 오류:', error);
        alert('테마 활성화 중 오류가 발생했습니다.');
    }
}

async function deleteTheme(id) {
    if (!confirm('정말 이 테마를 삭제하시겠습니까?')) return;
    try {
        const canDelete = await window.firebaseService.isThemeDeletable(id);
        if (!canDelete) {
            return alert('해당 테마를 사용하는 그림 이야기가 있어 삭제할 수 없습니다.');
        }
        await window.firebaseService.deleteTheme(id);
        alert('테마가 삭제되었습니다.');
        await renderThemeList();
    } catch (error) {
        console.error("테마 삭제 오류:", error);
        alert("테마 삭제 중 오류가 발생했습니다.");
    }
}

async function updateMemberClassOptions() {
    const establishmentId = document.getElementById('memberEstablishment').value;
    const classSelect = document.getElementById('memberClass');
    classSelect.innerHTML = '<option value="">-- 반 선택 --</option>';
    if (!establishmentId) return;

    const classes = await window.firebaseService.getClassesByEstablishment(establishmentId);
    classes.forEach(c => {
        classSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}

function renderEstablishmentOptions() {
    const select = document.getElementById('memberEstablishment');
    select.innerHTML = '<option value="">-- 교육기관 선택 --</option>';
    establishments.forEach(est => {
        select.innerHTML += `<option value="${est.id}">${est.name}</option>`;
    });
}

async function addMember() {
    const establishmentId = document.getElementById('memberEstablishment').value;
    const classId = document.getElementById('memberClass').value;
    const name = document.getElementById('memberName').value.trim();
    const birthdate = document.getElementById('memberBirthdate').value;
    const password = document.getElementById('memberPwd').value.trim();
    const role = document.getElementById('memberRole').value;
    if (!establishmentId || !name || !birthdate || !password || !role) return alert('모든 필드를 입력해주세요.');
    if ((role === 'student' || role === 'teacher') && !classId) return alert('원생 또는 선생님은 반드시 반을 선택해야 합니다.');
    
    try {
        if (await window.firebaseService.checkUserExists(name, establishmentId)) {
            return alert(`해당 교육기관에 이미 '${name}'이라는 이름의 구성원이 있습니다.`);
        }
        await window.firebaseService.createUser({ establishmentId, classId: classId || null, name, birthdate, password, role });
        alert('구성원이 등록되었습니다!');
        await loadDataAndRender();
    } catch (error) {
        console.error('구성원 등록 오류:', error);
        alert('구성원 등록 중 오류가 발생했습니다.');
    }
}

async function renderMemberList(filterEstId = null) {
    const listElement = document.getElementById('memberList');
    listElement.innerHTML = '';
    filterEstId = filterEstId || document.getElementById('memberEstablishment').value;
    let filteredUsers = users.filter(u => u.role !== 'admin' && (!filterEstId || u.establishmentId === filterEstId));
    
    const allClasses = await Promise.all(establishments.map(est => window.firebaseService.getClassesByEstablishment(est.id)));
    const classMap = Object.fromEntries(allClasses.flat().map(c => [c.id, c.name]));

    filteredUsers.forEach(user => {
        const establishment = establishments.find(est => est.id === user.establishmentId);
        const className = user.classId ? classMap[user.classId] || '미배정' : '해당 없음';
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="item-content">
                <div class="item-main-info">${user.name} / ${className} <span>(${roleMap[user.role] || user.role})</span></div>
                <div class="item-sub-info">
                    <span>소속: ${establishment ? establishment.name : '알 수 없음'}</span>
                    <span>생년월일: ${user.birthdate || ''}</span>
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
        listElement.appendChild(li);
    });
}

function filterMembersByEstablishment() {
    renderMemberList();
}

async function deleteMember(id) {
    if (!confirm('정말 이 구성원을 삭제하시겠습니까?')) return;
    try {
        await window.firebaseService.deleteUser(id);
        alert('구성원이 삭제되었습니다.');
        await loadDataAndRender();
    } catch (error) {
        console.error('구성원 삭제 오류:', error);
        alert('구성원 삭제 중 오류가 발생했습니다.');
    }
}

function renderMemberPermissionOptions() {
    const select = document.getElementById('permissionMemberSelect');
    select.innerHTML = '<option value="">-- 구성원 선택 --</option>';
    users.filter(u => u.role !== 'admin').forEach(user => {
        const establishment = establishments.find(est => est.id === user.establishmentId);
        select.innerHTML += `<option value="${user.id}">${user.name} (${establishment ? establishment.name : ''}) - 현재: ${roleMap[user.role] || user.role}</option>`;
    });
}

async function updateMemberPermission() {
    const userId = document.getElementById('permissionMemberSelect').value;
    const newRole = document.getElementById('permissionRoleSelect').value;
    if (!userId || !newRole) return alert('구성원과 새로운 권한을 선택해주세요.');
    try {
        const user = users.find(u => u.id === userId);
        await window.firebaseService.updateUserRole(userId, newRole);
        alert(`${user.name}님의 권한이 ${roleMap[newRole]}(으)로 변경되었습니다.`);
        await loadDataAndRender();
    } catch (error) {
        console.error('권한 변경 오류:', error);
        alert('권한 변경 중 오류가 발생했습니다.');
    }
}

async function handleRoleChange(selectElement, userId, oldRole) {
    const newRole = selectElement.value;
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmation = confirm(`${user.name}님의 권한을 '${roleMap[oldRole]}'에서 '${roleMap[newRole]}'(으)로 변경하시겠습니까?`);
    
    if (confirmation) {
        try {
            await window.firebaseService.updateUserRole(userId, newRole);
            alert('권한이 성공적으로 변경되었습니다.');
            await loadDataAndRender(); 
        } catch (error) {
            console.error('권한 변경 오류:', error);
            alert('권한 변경 중 오류가 발생했습니다.');
            selectElement.value = oldRole; 
        }
    } else {
        selectElement.value = oldRole; 
    }
}

function renderPermissionList() {
    const listElement = document.getElementById('permissionList');
    listElement.innerHTML = '';
    users.forEach(user => {
        const establishment = establishments.find(est => est.id === user.establishmentId);
        const li = document.createElement('li');

        let actionsHtml = '';
        if (user.role !== 'admin') {
            let roleOptions = '';
            for (const roleKey in roleMap) {
                if (roleKey === 'admin') continue;
                const selected = user.role === roleKey ? 'selected' : '';
                roleOptions += `<option value="${roleKey}" ${selected}>${roleMap[roleKey]}</option>`;
            }

            actionsHtml = `
            <div class="item-actions">
                <select class="role-select" onchange="handleRoleChange(this, '${user.id}', '${user.role}')">
                    ${roleOptions}
                </select>
                <div class="button-group-list">
                    <button onclick="deleteMember('${user.id}')">삭제</button>
                </div>
            </div>
            `;
        } else {
            actionsHtml = `<div class="item-actions"><span>수정 불가</span></div>`;
        }

        li.innerHTML = `
            <div class="item-content">
                <div class="item-main-info">
                    <span>${user.name}</span>
                </div>
                <div class="item-sub-info">
                    <span>소속: ${establishment ? establishment.name : '글로벌'}</span>
                </div>
            </div>
            ${actionsHtml}
        `;
        listElement.appendChild(li);
    });
}


function openEditModal(id) {
    const establishment = establishments.find(est => est.id === id);
    if (!establishment) return alert('교육기관 정보를 찾을 수 없습니다.');
    document.getElementById('editEstablishmentId').value = id;
    document.getElementById('editEstablishmentName').value = establishment.name;
    document.getElementById('editEstablishmentPhone').value = establishment.phone || '';
    
    const sidoSelect = document.getElementById('editEstablishmentSido');
    sidoSelect.innerHTML = '<option value="">-- 시/도 선택 --</option>';
    for (const sido in addressData) {
        sidoSelect.innerHTML += `<option value="${sido}">${sido}</option>`;
    }
    sidoSelect.value = establishment.address.sido;
    
    updateEditSigunguOptions();
    document.getElementById('editEstablishmentSigungu').value = establishment.address.sigungu;
    document.getElementById('editEstablishmentAddressDetail').value = establishment.address.detail;
    
    document.getElementById('editEstablishmentModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editEstablishmentModal').style.display = 'none';
}

async function saveEstablishmentChanges() {
    const id = document.getElementById('editEstablishmentId').value;
    const name = document.getElementById('editEstablishmentName').value.trim();
    const phone = document.getElementById('editEstablishmentPhone').value.trim();
    const sido = document.getElementById('editEstablishmentSido').value;
    const sigungu = document.getElementById('editEstablishmentSigungu').value;
    const detail = document.getElementById('editEstablishmentAddressDetail').value.trim();
    if (!name || !phone || !sido || !sigungu || !detail) return alert('모든 필드를 입력해주세요.');

    try {
        await window.firebaseService.updateEstablishment(id, { name, phone, address: { sido, sigungu, detail } });
        alert('교육기관 정보가 성공적으로 수정되었습니다.');
        closeEditModal();
        await loadDataAndRender();
    } catch (error) {
        console.error('교육기관 정보 수정 오류:', error);
        alert('정보 수정 중 오류가 발생했습니다.');
    }
}
function openEditThemeModal(id, currentName) {
    document.getElementById('editThemeId').value = id;
    document.getElementById('editThemeName').value = currentName;
    document.getElementById('editThemeModal').style.display = 'flex';
}

function closeEditThemeModal() {
    document.getElementById('editThemeModal').style.display = 'none';
}

async function saveThemeChanges() {
    const id = document.getElementById('editThemeId').value;
    const name = document.getElementById('editThemeName').value.trim();
    if (!name) return alert('테마 이름을 입력해주세요.');

    try {
        await window.firebaseService.updateTheme(id, { name });
        alert('테마 정보가 성공적으로 수정되었습니다.');
        closeEditThemeModal();
        await renderThemeList();
    } catch (error) {
        console.error('테마 정보 수정 오류:', error);
        alert('정보 수정 중 오류가 발생했습니다.');
    }
}

async function openEditMemberModal(id) {
    const user = users.find(u => u.id === id);
    if (!user) return alert('구성원 정보를 찾을 수 없습니다.');
    
    document.getElementById('editMemberId').value = id;
    document.getElementById('editMemberName').value = user.name;
    document.getElementById('editMemberBirthdate').value = user.birthdate;

    const classSelect = document.getElementById('editMemberClass');
    classSelect.innerHTML = '<option value="">-- 반 선택 --</option>';

    if (user.establishmentId) {
        try {
            const classes = await window.firebaseService.getClassesByEstablishment(user.establishmentId);
            classes.forEach(c => {
                classSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
            if (user.classId) {
                classSelect.value = user.classId;
            }
        } catch (error) {
            console.error("수정 모달에서 반 목록 로딩 오류:", error);
            alert("반 목록을 불러오는 데 실패했습니다.");
        }
    }
    
    document.getElementById('editMemberModal').style.display = 'flex';
}

function closeEditMemberModal() {
    document.getElementById('editMemberModal').style.display = 'none';
}

async function saveMemberChanges() {
    const id = document.getElementById('editMemberId').value;
    const name = document.getElementById('editMemberName').value.trim();
    const birthdate = document.getElementById('editMemberBirthdate').value;
    const classId = document.getElementById('editMemberClass').value;
    
    if (!name || !birthdate) return alert('모든 필드를 입력해주세요.');

    const currentUserData = users.find(u => u.id === id);
    if (users.some(u => u.id !== id && u.establishmentId === currentUserData.establishmentId && u.name === name)) {
        return alert('해당 교육기관에 이미 같은 이름의 구성원이 존재합니다.');
    }

    try {
        await window.firebaseService.updateUser(id, { name, birthdate, classId: classId || null });
        alert('구성원 정보가 성공적으로 수정되었습니다.');
        closeEditMemberModal();
        await loadDataAndRender();
    } catch (error) {
        console.error('구성원 정보 수정 오류:', error);
        alert('정보 수정 중 오류가 발생했습니다.');
    }
}

async function resetPassword(id) {
    const user = users.find(u => u.id === id);
    if (!user || !user.birthdate) {
        return alert('생년월일 정보가 없어 비밀번호를 초기화할 수 없습니다.');
    }
    if (!confirm(`${user.name}님의 비밀번호를 생년월일(YYYYMMDD)로 초기화하시겠습니까?`)) return;
    
    const newPassword = user.birthdate.replace(/-/g, '');
    try {
        await window.firebaseService.updateUser(id, { password: newPassword });
        alert(`비밀번호가 ${newPassword}(으)로 초기화되었습니다.`);
    } catch (error) {
        console.error('비밀번호 초기화 오류:', error);
        alert('비밀번호 초기화 중 오류가 발생했습니다.');
    }
}
