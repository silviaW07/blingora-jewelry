async function get_image_url(keywords: string, orientation: string, propKey: string, project_id: string, description: string, need_large_image: boolean, signal?: AbortSignal): Promise<string> {
    let url = "null";
    try {
        if (keywords.startsWith("data:") || keywords.startsWith("http")) {
            return keywords;
        }
        const uniqueIndex = Array.from(propKey).reduce((acc, char) => (acc + char.charCodeAt(0)) % 10, 0);
        const response = await fetch("https://project.autocoder.cc/api/project_pz/getimage", {
            method: 'POST',
            headers: {
                'Authorization': localStorage.getItem('full_token') || '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: keywords,
                orientation: orientation,
                index: uniqueIndex,
                project_id: project_id,
                description: description,
                need_large_image: need_large_image
            }),
            signal
        });
        if (response.ok) {
            const datas = await response.json();
            url = datas["url"];
        } else {
            console.error("Failed to load config. Status:", response.status);
        }
    } catch (error) {
        console.error("An error occurred while loading config:", error);
    }
    return url;
}

async function upload_image_file(file: File, projectId?: string): Promise<string> {
    try {
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('File size exceeds 5MB limit');
        }

        const project_id = "PROJ_fcb9e6ee_snap_20260726_092922_893";

        const formData = new FormData();
        formData.append('image', file);
        formData.append('project_id', project_id);

        const response = await fetch("https://project.autocoder.cc/api/project/image/upload/project", {
            method: 'POST',
            headers: {
                'AGC-language': 'en-US',
                'Accept': 'application/json, text/plain, */*',
                'X-Browser': 'Blink',
                'X-Language': 'en'
            },
            body: formData
        });

       if (response.ok) {
            const data = await response.json();
            if (data.code === 200 && data.data?.image_url) {
                return data.data.image_url;
            }
            return data.image_url || '';

        } else {
            console.error("Failed to upload image. Status:", response.status);
            throw new Error(`Upload failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error("An error occurred while uploading image:", error);
        throw error;
    }
}

/** Alias used by product management upload flows */
const upload_project_file = upload_image_file

export { upload_image_file, upload_project_file }

export default get_image_url
