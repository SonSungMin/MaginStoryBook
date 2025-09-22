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
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';

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
                isActive: false, // 기본값은 비활성
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
                where('establishmentId', '==', establishmentId)
            );
            const querySnapshot = await getDocs(q);
            const themes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            themes.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            return themes;
        } catch (error) {
            console.error("테마 조회 오류:", error);
            throw error;
        }
    }
    
    async getActiveTheme(establishmentId) {
        if (!establishmentId) return null;
        try {
            const q = query(
                collection(this.db, 'themes'),
                where('establishmentId', '==', establishmentId),
                where('isActive', '==', true),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                return null;
            }
            return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        } catch (error) {
            console.error("활성 테마 조회 오류:", error);
            return null;
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
    
    async updateThemeActivation(establishmentId, themeIdToActivate) {
        const batch = writeBatch(this.db);
        try {
            // 해당 기관의 모든 테마를 가져와 비활성화
            const themes = await this.getThemesByEstablishment(establishmentId);
            themes.forEach(theme => {
                if (theme.id !== themeIdToActivate) {
                    const themeRef = doc(this.db, 'themes', theme.id);
                    batch.update(themeRef, { isActive: false });
                }
            });
            
            // 선택한 테마만 활성화
            const activeThemeRef = doc(this.db, 'themes', themeIdToActivate);
            batch.update(activeThemeRef, { isActive: true });
            
            await batch.commit();
            console.log('테마 활성화 상태 업데이트 완료');
        } catch(error) {
            console.error('테마 활성화 오류:', error);
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
                where('name', '==', name)
            );
            const querySnapshot = await getDocs(q);
    
            if (querySnapshot.empty) {
                console.log('사용자 없음:', name);
                return null;
            }
    
            const userDoc = querySnapshot.docs.find(doc => doc.data().password === password);
            if (!userDoc) {
                console.log('비밀번호 불일치:', name);
                return null;
            }

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
                status: 'unregistered', // 'unregistered', 'registered', 'in_production', 'completed'
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
                where('uploaderId', '==', userId)
            );
            const querySnapshot = await getDocs(q);
            const stories = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            stories.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
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
            for (let i = 0; i < userIds.length; i += 30) {
                chunks.push(userIds.slice(i, i + 30));
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
    // 동화책(Storybooks) 관리
    // ===================
    async createStorybook(storybookData) {
        try {
            const docRef = await addDoc(collection(this.db, 'storybooks'), {
                ...storybookData,
                createdAt: serverTimestamp(),
            });
            console.log('동화책 생성 성공:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('동화책 생성 오류:', error);
            throw error;
        }
    }

    async getStorybookByStoryId(storyId) {
        try {
            const q = query(collection(this.db, 'storybooks'), where('originalStoryId', '==', storyId), limit(1));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                return null;
            }
            return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        } catch (error) {
            console.error('동화책 조회 오류:', error);
            throw error;
        }
    }
    
    async updateStorybook(storybookId, storybookData) {
        try {
            await updateDoc(doc(this.db, 'storybooks', storybookId), {
                ...storybookData,
                updatedAt: serverTimestamp()
            });
            console.log('동화책 업데이트 성공:', storybookId);
        } catch (error) {
            console.error('동화책 업데이트 오류:', error);
            throw error;
        }
    }
    
    async getAllStorybooks() {
        try {
            const q = query(collection(this.db, 'storybooks'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const storybooks = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return storybooks;
        } catch (error) {
            console.error('모든 동화책 조회 오류:', error);
            throw error;
        }
    }


    // ===================
    // 유틸리티 함수들
    // ===================
    async checkUserExists(name, establishmentId = null) {
        try {
            const q = query(
                collection(this.db, 'users'),
                where('name', '==', name)
            );
            
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) return false;

            if (establishmentId) {
                return querySnapshot.docs.some(doc => doc.data().establishmentId === establishmentId);
            }
            
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
