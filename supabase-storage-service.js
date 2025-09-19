// supabase-storage-service.js - Supabase 스토리지 전용 서비스

class SupabaseStorageService {
    constructor(supabaseClient) {
        if (!supabaseClient) {
            throw new Error('Supabase client must be provided.');
        }
        this.supabase = supabaseClient;
    }

    /**
     * 파일을 Supabase Storage에 업로드하고 공개 URL을 반환합니다.
     * @param {File} file - 업로드할 파일 객체
     * @param {string} path - Storage에 저장될 경로 (예: 'public/drawing.png')
     * @returns {Promise<string>} - 업로드된 파일의 공개 URL
     */
    async uploadImage(file, path) {
        try {
            const { data, error: uploadError } = await this.supabase
                .storage
                .from('images') // Supabase에 생성한 버킷 이름
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = this.supabase
                .storage
                .from('images')
                .getPublicUrl(path);

            if (!publicUrl) throw new Error('Public URL could not be generated.');

            console.log('Supabase - Image uploaded successfully:', publicUrl);
            return publicUrl;

        } catch (error) {
            console.error('Supabase - Image upload failed:', error);
            throw error;
        }
    }

    /**
     * Supabase Storage에서 파일을 삭제합니다.
     * @param {string} path - 삭제할 파일의 경로
     */
    async deleteImage(path) {
        try {
            const { error } = await this.supabase
                .storage
                .from('images')
                .remove([path]);

            if (error) throw error;

            console.log('Supabase - Image deleted successfully:', path);
        } catch (error) {
            console.error('Supabase - Image deletion failed:', error);
            // 파일이 이미 없어도 오류를 던지지 않도록 처리
        }
    }
}
