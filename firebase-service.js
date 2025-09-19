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
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import {
    ref,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

class FirebaseService {
    constructor() {
        this.db = window.firebase.db;
        this.storage = window.firebase.storage;
    }
    
    // ===================
    // 테마(Themes) 관리
    // ===================
    async createTheme(themeData) {
        try {
            const docRef = await addDoc(collection(this.db, 'themes'), {
                ...themeData,
                createdAt: serverTimestamp(),
            });
            console.log('테마 생성 성공:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("테마 생성 오류:", error);
            throw error;
        }
    }

    async getThemesByEstablishment(establishmentId) {
        if (!establishmentId) return [];
        try {
            const q = query(
                collection(this.db, 'themes'),
                where('establishmentId', '==', establishmentId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("테마 조회 오류:", error);
            throw error;
        }
    }

    async updateTheme(themeId, updateData) {
        try {
            await updateDoc(doc(this.db, 'themes', themeId), updateData);
            console.log('테마 업데이트 완료:', themeId);
        } catch (error) {
            console.error('테마 업데이트 오류:', error);
            throw error;
        }
    }

    async deleteTheme(themeId) {
        try {
            await deleteDoc(doc(this.db, 'themes', themeId));
            console.log('테마 삭제 완료:', themeId);
        } catch (error) {
            console.error("테마 삭제 오류:", error);
            throw error;
        }
    }

    async isThemeDeletable(themeId) {
        try {
            const q = query(
                collection(this.db, 'stories'),
                where('themeId', '==', themeId),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.empty;
        } catch (error) {
            console.error('테마 사용 여부 확인 오류:', error);
            return false;
        }
    }


    // ===================
    // 반(Classes) 관리
    // ===================
    async createClass(classData) {
        try {
            const docRef = await addDoc(collection(this.db, 'classes'), {
                ...classData,
                createdAt: serverTimestamp(),
            });
            console.log('반 생성 성공:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("반 생성 오류:", error);
            throw error;
        }
    }

    async getClassesByEstablishment(establishmentId) {
        if (!establishmentId) return [];
        try {
            const q = query(
                collection(this.db, 'classes'),
                where('establishmentId', '==', establishmentId)
            );
            const querySnapshot = await getDocs(q);
            const classes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            classes.sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            });

            return classes;
        } catch (error) {
            console.error("반 조회 오류:", error);
            throw error;
        }
    }

    async deleteClass(classId) {
        try {
            await deleteDoc(doc(this.db, 'classes', classId));
            console.log('반 삭제 완료:', classId);
        } catch (error) {
            console.error("반 삭제 오류:", error);
            throw error;
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
            const q = query(collection(this.db, 'establishments'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
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
        const batch = writeBatch(this.db);

        try {
            const classesQuery = query(collection(this.db, 'classes'), where('establishmentId', '==', establishmentId));
            const classesSnapshot = await getDocs(classesQuery);
            classesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            const themesQuery = query(collection(this.db, 'themes'), where('establishmentId', '==', establishmentId));
            const themesSnapshot = await getDocs(themesQuery);
            themesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            await this.deleteUsersByEstablishment(establishmentId);

            const establishmentRef = doc(this.db, 'establishments', establishmentId);
            batch.delete(establishmentRef);

            await batch.commit();
            console.log('교육기관 및 모든 관련 데이터 삭제 완료:', establishmentId);
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
    
            if (userData.establishmentId) {
                const estDocRef = doc(this.db, 'establishments', userData.establishmentId);
                const estDoc = await getDoc(estDocRef);
                if (estDoc.exists()) {
                    userData.establishmentName = estDoc.data().name;
                } else {
                    userData.establishmentName = '소속 없음';
                }
            }
    
            console.log('사용자 로그인 성공:', userData.name);
            return userData;
        } catch (error) {
            console.error('사용자 조회 오류:', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const q = query(collection(this.db, 'users'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
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
            await this.deleteStoriesByUser(userId);

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
                    where('uploaderId', 'in', chunk)
                );
                const querySnapshot = await getDocs(q);
                const stories = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                allStories.push(...stories);
            }

            allStories.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

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
                    const filePath = new URL(storyData.originalImgUrl).pathname.split('/images/').pop();
                    if(filePath) {
                         await window.supabaseStorageService.deleteImage(filePath);
                    }
                }
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
                where('name', '==', name),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('교육기관 존재 확인 오류:', error);
            throw error;
        }
    }

    formatDate(timestamp) {
        if (!timestamp) return '';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('ko-KR');
    }
}

window.firebaseService = new FirebaseService();
