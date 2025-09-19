// js/version-injector.js

// 페이지가 로드되었을 때 버전 정보를 푸터에 자동으로 주입합니다.
document.addEventListener('DOMContentLoaded', () => {
    // '.version-footer' 클래스를 가진 모든 요소를 찾습니다.
    const versionFooters = document.querySelectorAll('.version-footer');
    
    // window.APP_CONFIG 객체와 version 정보가 있는지 확인합니다.
    if (window.APP_CONFIG && window.APP_CONFIG.version) {
        // 찾은 모든 푸터 요소에 버전 텍스트를 설정합니다.
        versionFooters.forEach(footer => {
            footer.textContent = `v${window.APP_CONFIG.version}`;
        });
    } else {
        // 설정 파일이 없거나 버전 정보가 없을 경우 에러를 콘솔에 출력합니다.
        console.error('애플리케이션 버전 정보를 찾을 수 없습니다. config.js 파일을 확인해주세요.');
    }
});
