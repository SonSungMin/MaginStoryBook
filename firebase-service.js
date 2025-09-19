// firebase-service.js - Firebase 데이터베이스 서비스

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    limit,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

class FirebaseService {
    constructor() {
        this.db = window.firebase.db;
        this.storage = window.firebase.storage;
    }

    // ===================
    // 실시간 리스너 (실시간 업데이트용)
    // ===================

    setupEstablishmentListener(callback) {
        try {
            const q = query(collection(this.db, 'establishments'), orderBy('createdAt', 'desc'));
            return onSnapshot(q, (querySnapshot) => {
                const establishments = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('교육기관 실시간 업데이트:', establishments.length, '개');
                callback(establishments);
            }, (error) => {
                console.error('교육기관 실시간 리스너 오류:', error);
            });
        } catch (error) {
            console.error('교육기관 리스너 설정 오류:', error);
            return null;
        }
    }

    setupUserListener(callback) {
        try {
            const q = query(collection(this.db, 'users'), orderBy('createdAt', 'desc'));
            return onSnapshot(q, (querySnapshot) => {
                const users = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('사용자 실시간 업데이트:', users.length, '명');
                callback(users);
            }, (error) => {
                console.error('사용자 실시간 리스너 오류:', error);
            });
        } catch (error) {
            console.error('사용자 리스너 설정 오류:', error);
            return null;
        }
    }

    setupStoryListener(callback) {
        try {
            const q = query(collection(this.db, 'stories'), orderBy('createdAt', 'desc'));
            return onSnapshot(q, (querySnapshot) => {
                const stories = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('작품 실시간 업데이트:', stories.length, '개');
                callback(stories);
            }, (error) => {
                console.error('작품 실시간 리스너 오류:', error);
            });
        } catch (error) {
            console.error('작품 리스너 설정 오류:', error);
            return null;
        }
    }

    // ===================
    // 교육기관(Establishments) 관리
    // ===================

    async createEstablishment(establishmentData) {
        try {
            const docRef = await addDoc(collection(this.db, 'establishments'), {
                ...establishmentData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log('교육기관 생성 성공:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('교육기관 생성 오류:', error);
            throw error;
        }
    }

    async updateEstablishment(establishmentId, updateData) {
        try {
            await updateDoc(doc(this.db, 'establishments', establishmentId), {
                ...updateData,
                updatedAt: serverTimestamp()
            });
            console.log('교육기관 정보 업데이트 완료:', establishmentId);
        } catch (error) {
            console.error('교육기관 정보 업데이트 오류:', error);
            throw error;
        }
    }

    async getAllEstablishments() {
        try {
            const querySnapshot = await getDocs(collection(this.db, 'establishments'));
            const establishments = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('교육기관 목록 조회:', establishments.length, '개');
            return establishments;
        } catch (error) {
            console.error('교육기관 조회 오류:', error);
            throw error;
        }
    }

    async deleteEstablishment(establishmentId) {
        try {
            // 관련 사용자들도 삭제
            await this.deleteUsersByEstablishment(establishmentId);

            // 교육기관 삭제
            await deleteDoc(doc(this.db, 'establishments', establishmentId));
            console.log('교육기관 삭제 완료:', establishmentId);
        } catch (error) {
            console.error('교육기관 삭제 오류:', error);
            throw error;
        }
    }

    // ===================
    // 사용자(Users) 관리
    // ===================

    async createUser(userData) {
        try {
            const docRef = await addDoc(collection(this.db, 'users'), {
                ...userData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log('사용자 생성 성공:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('사용자 생성 오류:', error);
            throw error;
        }
    }

    async getUserByNameAndPassword(name, password) {
        try {
            const q = query(
                collection(this.db, 'users'),
                where('name', '==', name),
                where('password', '==', password),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log('사용자 없음:', name);
                return null;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = {
                id: userDoc.id,
                ...userDoc.data()
            };
            console.log('사용자 로그인 성공:', userData.name);
            return userData;
        } catch (error) {
            console.error('사용자 조회 오류:', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const querySnapshot = await getDocs(collection(this.db, 'users'));
            const users = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('사용자 목록 조회:', users.length, '명');
            return users;
        } catch (error) {
            console.error('사용자 목록 조회 오류:', error);
            throw error;
        }
    }

    async getUsersByEstablishment(establishmentId) {
        try {
            const q = query(
                collection(this.db, 'users'),
                where('establishmentId', '==', establishmentId)
            );
            const querySnapshot = await getDocs(q);
            const users = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('교육기관별 사용자 조회:', establishmentId, '-', users.length, '명');
            return users;
        } catch (error) {
            console.error('교육기관별 사용자 조회 오류:', error);
            throw error;
        }
    }

    async updateUser(userId, updateData) {
        try {
            await updateDoc(doc(this.db, 'users', userId), {
                ...updateData,
                updatedAt: serverTimestamp()
            });
            console.log('사용자 정보 업데이트 완료:', userId);
        } catch (error) {
            console.error('사용자 정보 업데이트 오류:', error);
            throw error;
        }
    }


    async updateUserRole(userId, newRole) {
        try {
            await updateDoc(doc(this.db, 'users', userId), {
                role: newRole,
                updatedAt: serverTimestamp()
            });
            console.log('사용자 권한 변경 완료:', userId, '->', newRole);
        } catch (error) {
            console.error('사용자 권한 변경 오류:', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            // 사용자의 모든 작품도 삭제
            await this.deleteStoriesByUser(userId);

            // 사용자 삭제
            await deleteDoc(doc(this.db, 'users', userId));
            console.log('사용자 삭제 완료:', userId);
        } catch (error) {
            console.error('사용자 삭제 오류:', error);
            throw error;
        }
    }

    async deleteUsersByEstablishment(establishmentId) {
        try {
            const users = await this.getUsersByEstablishment(establishmentId);
            const deletePromises = users.map(user => this.deleteUser(user.id));
            await Promise.all(deletePromises);
            console.log('교육기관 사용자 일괄 삭제 완료:', establishmentId);
        } catch (error) {
            console.error('교육기관 사용자 일괄 삭제 오류:', error);
            throw error;
        }
    }

    // ===================
    // 작품(Stories) 관리
    // ===================

    async createStory(storyData) {
        try {
            const docRef = await addDoc(collection(this.db, 'stories'), {
                ...storyData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log('작품 생성 성공:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('작품 생성 오류:', error);
            throw error;
        }
    }

    async getStoriesByUser(userId) {
        try {
            const q = query(
                collection(this.db, 'stories'),
                where('uploaderId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const stories = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('사용자 작품 조회:', userId, '-', stories.length, '개');
            return stories;
        } catch (error) {
            console.error('사용자 작품 조회 오류:', error);
            throw error;
        }
    }

    async getStoriesByEstablishment(establishmentId) {
        try {
            const users = await this.getUsersByEstablishment(establishmentId);
            const userIds = users.map(user => user.id);

            if (userIds.length === 0) {
                console.log('교육기관에 사용자가 없음:', establishmentId);
                return [];
            }

            const chunks = [];
            for (let i = 0; i < userIds.length; i += 10) {
                chunks.push(userIds.slice(i, i + 10));
            }

            const allStories = [];
            for (const chunk of chunks) {
                const q = query(
                    collection(this.db, 'stories'),
                    where('uploaderId', 'in', chunk),
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const stories = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                allStories.push(...stories);
            }

            allStories.sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            });

            console.log('교육기관 작품 조회:', establishmentId, '-', allStories.length, '개');
            return allStories;
        } catch (error) {
            console.error('교육기관 작품 조회 오류:', error);
            throw error;
        }
    }

    async getAllStories() {
        try {
            const q = query(
                collection(this.db, 'stories'),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const stories = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('전체 작품 조회:', stories.length, '개');
            return stories;
        } catch (error) {
            console.error('전체 작품 조회 오류:', error);
            throw error;
        }
    }

    async updateStory(storyId, updateData) {
        try {
            await updateDoc(doc(this.db, 'stories', storyId), {
                ...updateData,
                updatedAt: serverTimestamp()
            });
            console.log('작품 업데이트 완료:', storyId);
        } catch (error) {
            console.error('작품 업데이트 오류:', error);
            throw error;
        }
    }

    async deleteStory(storyId) {
        try {
            const storyDocRef = doc(this.db, 'stories', storyId);
            const storyDoc = await getDoc(storyDocRef);

            if (storyDoc.exists()) {
                const storyData = storyDoc.data();
                if (storyData.originalImgUrl) {
                    // Supabase URL에서 파일 경로 추출
                    const filePath = new URL(storyData.originalImgUrl).pathname.split('/images/').pop();
                    if(filePath) {
                         // Supabase 스토리지 서비스의 파일 삭제 메소드 호출
                         await window.supabaseStorageService.deleteImage(filePath);
                    }
                }
                 // Firestore 문서 삭제
                await deleteDoc(storyDocRef);
                console.log('작품 삭제 완료:', storyId);
            } else {
                 console.log('삭제할 작품을 찾을 수 없습니다.');
            }

        } catch (error) {
            console.error('작품 삭제 오류:', error);
            throw error;
        }
    }

    async deleteStoriesByUser(userId) {
        try {
            const stories = await this.getStoriesByUser(userId);
            const deletePromises = stories.map(story => this.deleteStory(story.id));
            await Promise.all(deletePromises);
            console.log('사용자 작품 일괄 삭제 완료:', userId);
        } catch (error) {
            console.error('사용자 작품 일괄 삭제 오류:', error);
            throw error;
        }
    }

    // ===================
    // 파일 업로드/삭제 (Firebase Storage)
    // ===================

    async uploadImage(file, path) {
        try {
            console.log('이미지 업로드 시작:', path);
            const storageRef = ref(this.storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log('이미지 업로드 완료:', downloadURL);
            return {
                url: downloadURL,
                path: path
            };
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            throw error;
        }
    }

    async deleteFile(path) {
        try {
            const storageRef = ref(this.storage, path);
            await deleteObject(storageRef);
            console.log('파일 삭제 완료:', path);
        } catch (error) {
            console.error('파일 삭제 오류:', error);
            // 파일이 이미 삭제되었거나 존재하지 않을 수 있으므로 에러를 throw하지 않음
        }
    }

    // ===================
    // 유틸리티 함수들
    // ===================

    async checkUserExists(name, establishmentId = null) {
        try {
            let q;
            if (establishmentId) {
                q = query(
                    collection(this.db, 'users'),
                    where('name', '==', name),
                    where('establishmentId', '==', establishmentId),
                    limit(1)
                );
            } else {
                q = query(
                    collection(this.db, 'users'),
                    where('name', '==', name),
                    limit(1)
                );
            }

            const querySnapshot = await getDocs(q);
            const exists = !querySnapshot.empty;
            console.log('사용자 존재 확인:', name, '-', exists);
            return exists;
        } catch (error) {
            console.error('사용자 존재 확인 오류:', error);
            throw error;
        }
    }

    async checkEstablishmentExists(name) {
        try {
            const q = query(
                collection(this.db, 'establishments'),
                where('name', '==', name),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            const exists = !querySnapshot.empty;
            console.log('교육기관 존재 확인:', name, '-', exists);
            return exists;
        } catch (error) {
            console.error('교육기관 존재 확인 오류:', error);
            throw error;
        }
    }

    // Timestamp를 Date 문자열로 변환
    formatDate(timestamp) {
        if (!timestamp || !timestamp.toDate) {
            return new Date().toLocaleDateString('ko-KR');
        }
        return timestamp.toDate().toLocaleDateString('ko-KR');
    }

    // Base64를 File 객체로 변환
    base64ToFile(base64String, fileName) {
        const arr = base64String.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], fileName, { type: mime });
    }
}

// 전역 서비스 인스턴스 생성
window.firebaseService = new FirebaseService();

console.log('Firebase 서비스 클래스 로드 완료');
