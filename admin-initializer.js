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
window.firebase = { app, db, auth, storage };
console.log('Firebase 초기화 완료');

// Supabase 초기화 로직 추가
try {
    const SUPABASE_URL = 'https://guonchhshaopidmjozhk.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1b25jaGhzaGFvcGlkbWpvemhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzU2ODUsImV4cCI6MjA3Mzc1MTY4NX0.prY4iGz09EJHGuGHzLTpz-eEUu7TG5flWOGGX_2R8IY';
    // 'supabase'는 admin.html에 추가된 스크립트를 통해 전역으로 접근 가능합니다.
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // 'SupabaseStorageService'는 admin.html에 추가된 스크립트를 통해 전역으로 접근 가능합니다.
    window.supabaseStorageService = new SupabaseStorageService(supabaseClient);
    console.log('Supabase 초기화 완료 (Admin)');
} catch (error) {
    console.error('Supabase 초기화에 실패했습니다 (Admin):', error);
    alert('이미지 저장 서비스 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
}


// Firebase 서비스와 관리자 페이지 로직 로드
Promise.all([
    import('./firebase-service.js'),
    import('./admin-firebase.js')
]).then(([firebaseServiceModule, adminFirebaseModule]) => {
    console.log('모든 모듈 로드 완료.');
    adminFirebaseModule.initializeAdminPage();
}).catch(error => {
    console.error('스크립트 모듈 로드 실패:', error);
});
