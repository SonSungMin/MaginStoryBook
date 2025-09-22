// admin-initializer.js

// Firebase SDK import
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Firebase 설정 ( ... )
const firebaseConfig = {
    apiKey: "AIzaSyAd9mICdy1tVtQQS6X6-qx_Qnm1q9g6nMk",
    authDomain: "magicstorybookdb.firebaseapp.com",
    projectId: "magicstorybookdb",
    storageBucket: "magicstorybookdb.appspot.com",
    messagingSenderId: "6167602990",
    appId: "1:6167602990:web:a4f95392b5cb7169e87cbf",
    measurementId: "G-0E119QHRK3"
};

// Firebase 초기화 ( ... )
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
window.firebase = { app, db, auth, storage };
console.log('Firebase 초기화 완료');

// Firebase 서비스와 관리자 페이지 로직 로드
Promise.all([
    import('./firebase-service.js'),
    import('./admin-firebase.js')
]).then(([firebaseServiceModule, adminFirebaseModule]) => {
    console.log('모든 모듈 로드 완료.');
    
    // 💡 오류 해결의 핵심: DOMContentLoaded 이벤트를 기다리지 않고 바로 초기화 함수를 실행합니다.
    // admin.html 파일에서 스크립트를 body 태그 맨 끝에서 로드하므로 DOM은 이미 준비된 상태입니다.
    adminFirebaseModule.initializeAdminPage();

}).catch(error => {
    console.error('스크립트 모듈 로드 실패:', error);
});
