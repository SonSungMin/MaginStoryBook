document.addEventListener('DOMContentLoaded', () => {
    // --- 데이터 구조 정의 (localStorage) ---
    let establishments = JSON.parse(localStorage.getItem('establishments')) || [];
    let users = JSON.parse(localStorage.getItem('users')) || [];

    // 초기 관리자 계정 (없으면 생성)
    if (!users.some(u => u.name === 'admin' && u.role === 'admin')) {
        users.push({ id: 'user-' + Date.now(), name: 'admin', password: 'admin', role: 'admin', establishmentId: 'global' });
        saveUsers();
    }
    // 초기 교육기관 (없으면 생성)
    if (establishments.length === 0) {
         establishments.push({ id: 'est-1', name: '코드그림유치원', address: '서울시 강남구', adminName: 'admin', adminPwd: 'admin' });
         saveEstablishments();
    }
    // 초기 구성원 (없으면 생성)
    if (!users.some(u => u.name === 'teacher1')) {
        users.push({ id: 'user-' + Date.now(), name: 'teacher1', password: '123', birthdate: '1990-01-01', role: 'teacher', establishmentId: 'est-1' });
        users.push({ id: 'user-' + Date.now(), name: 'student1', password: '123', birthdate: '2018-05-10', role: 'student', establishmentId: 'est-1' });
        users.push({ id: 'user-' + Date.now(), name: 'student2', password: '123', birthdate: '2019-03-22', role: 'student', establishmentId: 'est-1' });
        saveUsers();
    }


    function saveEstablishments() {
        localStorage.setItem('establishments', JSON.stringify(establishments));
    }

    function saveUsers() {
        localStorage.setItem('users', JSON.stringify(users));
    }

    // --- DOM 요소 캐싱 ---
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


    // --- 섹션 전환 기능 ---
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

    adminNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            adminNavButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activateAdminSection(button.dataset.target);
        });
    });

    // --- 1. 교육기관 관리 ---
    window.addEstablishment = function() {
        const name = establishmentNameInput.value.trim();
        const address = establishmentAddressInput.value.trim();
        const adminName = establishmentAdminNameInput.value.trim();
        const adminPwd = establishmentAdminPwdInput.value.trim();

        if (!name || !address || !adminName || !adminPwd) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        if (establishments.some(est => est.name === name)) {
            alert('이미 존재하는 상호입니다.');
            return;
        }
        if (users.some(user => user.name === adminName)) {
            alert('교육기관 관리자 이름(ID)이 이미 존재합니다. 다른 이름을 사용해주세요.');
            return;
        }

        const newEstablishmentId = 'est-' + Date.now();
        establishments.push({
            id: newEstablishmentId,
            name,
            address,
            adminName,
            adminPwd // 실제 구현 시 암호화 필요
        });
        saveEstablishments();

        // 교육기관 관리자 계정 생성
        users.push({
            id: 'user-' + Date.now(),
            name: adminName,
            password: adminPwd, // 실제 구현 시 암호화 필요
            role: 'director', // 교육기관 관리자는 원장 또는 별도의 'est_admin' 권한
            establishmentId: newEstablishmentId
        });
        saveUsers();

        alert('교육기관가 등록되었습니다!');
        establishmentNameInput.value = '';
        establishmentAddressInput.value = '';
        establishmentAdminNameInput.value = '';
        establishmentAdminPwdInput.value = '';
        renderEstablishmentList();
    };

    function renderEstablishmentList() {
        establishmentList.innerHTML = '';
        establishments.forEach(est => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="item-info">
                    <strong>${est.name}</strong> (${est.address})<br>
                    관리자: ${est.adminName} (ID: ${est.adminName})
                </span>
                <button onclick="deleteEstablishment('${est.id}')"><i class="fas fa-trash"></i> 삭제</button>
            `;
            establishmentList.appendChild(li);
        });
    }

    window.deleteEstablishment = function(id) {
        if (!confirm('정말 이 교육기관를 삭제하시겠습니까? 관련 구성원도 모두 삭제됩니다.')) return;
        
        establishments = establishments.filter(est => est.id !== id);
        users = users.filter(user => user.establishmentId !== id); // 관련 구성원 모두 삭제
        saveEstablishments();
        saveUsers();
        alert('교육기관 및 관련 구성원이 삭제되었습니다.');
        renderEstablishmentList();
        renderMemberPermissionOptions(); // 권한 관리 목록도 갱신
        renderMemberList();
    };


    // --- 2. 구성원 등록 ---
    function renderEstablishmentOptions() {
        memberEstablishmentSelect.innerHTML = '<option value="">-- 교육기관 선택 --</option>';
        establishments.forEach(est => {
            const option = document.createElement('option');
            option.value = est.id;
            option.textContent = est.name;
            memberEstablishmentSelect.appendChild(option);
        });
    }

    window.addMember = function() {
        const establishmentId = memberEstablishmentSelect.value;
        const name = memberNameInput.value.trim();
        const birthdate = memberBirthdateInput.value;
        const password = memberPwdInput.value.trim();
        const role = memberRoleSelect.value;

        if (!establishmentId || !name || !birthdate || !password || !role) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        if (users.some(u => u.name === name && u.establishmentId === establishmentId)) {
            alert(`해당 교육기관에 이미 '${name}'이라는 이름의 구성원이 있습니다.`);
            return;
        }

        users.push({
            id: 'user-' + Date.now(),
            establishmentId,
            name,
            birthdate,
            password, // 실제 구현 시 암호화 필요
            role
        });
        saveUsers();
        alert('구성원이 등록되었습니다!');
        memberNameInput.value = '';
        memberBirthdateInput.value = '';
        memberPwdInput.value = '';
        memberRoleSelect.value = 'student';
        renderMemberList();
        renderMemberPermissionOptions(); // 권한 관리 목록도 갱신
    };

    function renderMemberList(filterEstId = null) {
        memberList.innerHTML = '';
        const filteredUsers = filterEstId ? users.filter(u => u.establishmentId === filterEstId) : users;

        filteredUsers.forEach(user => {
            // 관리자 계정은 여기서 수정/삭제하지 않도록 (별도 관리)
            if (user.role === 'admin') return;

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

    window.deleteMember = function(id) {
        if (!confirm('정말 이 구성원을 삭제하시겠습니까?')) return;
        
        users = users.filter(user => user.id !== id);
        saveUsers();
        alert('구성원이 삭제되었습니다.');
        renderMemberList(memberEstablishmentSelect.value || null);
        renderMemberPermissionOptions(); // 권한 관리 목록도 갱신
    };


    // --- 3. 권한 관리 ---
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

    window.updateMemberPermission = function() {
        const userId = permissionMemberSelect.value;
        const newRole = permissionRoleSelect.value;

        if (!userId || !newRole) {
            alert('구성원과 새로운 권한을 선택해주세요.');
            return;
        }

        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].role = newRole;
            saveUsers();
            alert(`${users[userIndex].name}님의 권한이 ${newRole}(으)로 변경되었습니다.`);
            renderPermissionList();
            renderMemberPermissionOptions(); // select box 갱신
        } else {
            alert('구성원을 찾을 수 없습니다.');
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


    // --- 초기화 및 시작 ---
    activateAdminSection('manage-establishments'); // 기본으로 교육기관 관리 섹션 활성화

});
