// admin-initializer.js

// Firebase SDK import
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyAd9mICdy1tVtQQS6X6-qx_Qnm1q9g6nMk",
    authDomain: "magicstorybookdb.firebaseapp.com",
    projectId: "magicstorybookdb",
    storageBucket: "magicstorybookdb.appspot.com",
    messagingSenderId: "6167602990",
    appId: "1:6167602990:web:a4f95392b5cb7169e87cbf",
    measurementId: "G-0E119QHRK3"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// 전역 변수로 설정
window.firebase = { app, db, auth, storage };
console.log('Firebase 초기화 완료');

// Firebase 서비스와 관리자 페이지 로직 로드
Promise.all([
    import('./firebase-service.js'),
    import('./admin-firebase.js')
]).then(([firebaseServiceModule, adminFirebaseModule]) => {
    console.log('모든 모듈 로드 완료.');
    
    // DOM이 완전히 로드된 후 페이지 초기화 함수를 안전하게 호출
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', adminFirebaseModule.initializeAdminPage);
    } else {
        adminFirebaseModule.initializeAdminPage();
    }
}).catch(error => {
    console.error('스크립트 모듈 로드 실패:', error);
});
