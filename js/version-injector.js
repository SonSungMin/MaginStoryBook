// js/version-injector.js

// 페이지가 로드되었을 때 버전 정보를 푸터에 자동으로 주입합니다.
document.addEventListener('DOMContentLoaded', () => {
    // '.version-footer' 클래스를 가진 모든 요소를 찾습니다.
    const versionFooters = document.querySelectorAll('.version-footer');
    
    versionFooters.forEach(footer => {
        // Clear footer content to avoid duplicates on hot-reloads/re-runs
        footer.innerHTML = ''; 

        const versionSpan = document.createElement('span');
        if (window.APP_CONFIG && window.APP_CONFIG.version) {
            versionSpan.textContent = `v${window.APP_CONFIG.version}`;
        } else {
            console.error('애플리케이션 버전 정보를 찾을 수 없습니다. config.js 파일을 확인해주세요.');
        }

        const userInfoSpan = document.createElement('span');
        userInfoSpan.className = 'user-info'; // 클래스 추가
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

        if (loggedInUser) {
            userInfoSpan.textContent = `${loggedInUser.establishmentName || '소속 없음'} - ${loggedInUser.name}님  `;
        }

        footer.appendChild(versionSpan);
        footer.appendChild(userInfoSpan);
    });
});
