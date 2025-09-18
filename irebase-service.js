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
    serverTimestamp 
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
    // 사용처(Establishments) 관리
    // ===================
    
    async createEstablishment(establishmentData) {
        try {
            const docRef = await addDoc(collection(this.db, 'establishments'), {
                ...establishmentData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('사용처 생성 오류:', error);
            throw error;
        }
    }

    async getAllEstablishments() {
        try {
            const querySnapshot = await getDocs(collection(this.db, 'establishments'));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('사용처 조회 오류:', error);
            throw error;
        }
    }

    async deleteEstablishment(establishmentId) {
        try {
            // 관련 사용자들도 삭제
            await this.deleteUsersByEstablishment(establishmentId);
            
            // 사용처 삭제
            await deleteDoc(doc(this.db, 'establishments', establishmentId));
        } catch (error) {
            console.error('사용처 삭제 오류:', error);
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
                where('password', '==', password)
            );
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return null;
            }
            
            const userDoc = querySnapshot.docs[0];
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        } catch (error) {
            console.error('사용자 조회 오류:', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const querySnapshot = await getDocs(collection(this.db, 'users'));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
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
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('사용처별 사용자 조회 오류:', error);
            throw error;
        }
    }

    async updateUserRole(userId, newRole) {
        try {
            await updateDoc(doc(this.db, 'users', userId), {
                role: newRole,
                updatedAt: serverTimestamp()
            });
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
        } catch (error) {
            console.error('사용처 사용자 일괄 삭제 오류:', error);
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
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('사용자 작품 조회 오류:', error);
            throw error;
        }
    }

    async getStoriesByEstablishment(establishmentId) {
        try {
            // 먼저 해당 사용처의 모든 사용자를 가져오기
            const users = await this.getUsersByEstablishment(establishmentId);
            const userIds = users.map(user => user.id);

            if (userIds.length === 0) {
                return [];
            }

            // Firestore의 'in' 쿼리는 최대 10개까지만 지원하므로 청크 단위로 처리
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

            // 날짜순으로 다시 정렬
            return allStories.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        } catch (error) {
            console.error('사용처 작품 조회 오류:', error);
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
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
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
        } catch (error) {
            console.error('작품 업데이트 오류:', error);
            throw error;
        }
    }

    async deleteStory(storyId) {
        try {
            // 먼저 스토리 정보 가져오기 (이미지 삭제를 위해)
            const storyDoc = await getDoc(doc(this.db, 'stories', storyId));
            if (storyDoc.exists()) {
                const storyData = storyDoc.data();
                
                // Storage에서 이미지 파일들 삭제
                if (storyData.originalImgPath) {
                    await this.deleteFile(storyData.originalImgPath);
                }
                if (storyData.aiImgPath) {
                    await this.deleteFile(storyData.aiImgPath);
                }
            }

            // Firestore에서 문서 삭제
            await deleteDoc(doc(this.db, 'stories', storyId));
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
            const storageRef = ref(this.storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
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
                    where('establishmentId', '==', establishmentId)
                );
            } else {
                q = query(
                    collection(this.db, 'users'),
                    where('name', '==', name)
                );
            }
            
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('사용자 존재 확인 오류:', error);
            throw error;
        }
    }

    async checkEstablishmentExists(name) {
        try {
            const q = query(
                collection(this.db, 'establishments'),
                where('name', '==', name)
            );
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('사용처 존재 확인 오류:', error);
            throw error;
        }
    }

    // Timestamp를 Date 문자열로 변환
    formatDate(timestamp) {
        if (!timestamp) return new Date().toLocaleDateString('ko-KR');
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

    // ===================
    // 초기 데이터 설정 (개발용)
    // ===================

    async initializeSampleData() {
        try {
            // 기본 관리자 계정 확인 및 생성
            const adminExists = await this.checkUserExists('admin');
            if (!adminExists) {
                await this.createUser({
                    name: 'admin',
                    password: 'admin',
                    role: 'admin',
                    establishmentId: 'global'
                });
            }

            // 샘플 사용처 확인 및 생성
            const estExists = await this.checkEstablishmentExists('코드그림유치원');
            if (!estExists) {
                const estId = await this.createEstablishment({
                    name: '코드그림유치원',
                    address: '서울시 강남구',
                    adminName: 'admin',
                    adminPwd: 'admin'
                });

                // 샘플 사용자들 생성
                await this.createUser({
                    name: 'teacher1',
                    password: '123',
                    birthdate: '1990-01-01',
                    role: 'teacher',
                    establishmentId: estId
                });

                await this.createUser({
                    name: 'student1',
                    password: '123',
                    birthdate: '2018-05-10',
                    role: 'student',
                    establishmentId: estId
                });

                await this.createUser({
                    name: 'student2',
                    password: '123',
                    birthdate: '2019-03-22',
                    role: 'student',
                    establishmentId: estId
                });

                console.log('샘플 데이터 생성 완료');
            }
        } catch (error) {
            console.error('샘플 데이터 초기화 오류:', error);
        }
    }
}

// 전역 서비스 인스턴스 생성
window.firebaseService = new FirebaseService();
