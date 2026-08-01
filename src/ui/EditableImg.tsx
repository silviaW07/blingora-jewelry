import React, { CSSProperties, useState, useEffect, useMemo } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import get_image_url from '../../src/tools/tools';

interface EditableImgProps {
    src?: string; // 图片的初始地址
    alt?: string; // 图片的初始描述
    className?: string; // 自定义样式类名
    propKey: string; // 必须传入的唯一标识符
    style?: CSSProperties; // 内联样式
    keywords?: string; // 用于关键词获取图片
    orientation?: 'landscape' | 'portrait' | 'square'; // 图片方向
}

const defaultStyle: CSSProperties = {
    objectFit: 'cover',
};

const extractProjectId = (): string => {
    if (typeof window === 'undefined') {
        return '';
    }
    try {
        const currentUrl = new URL(window.location.href);
        const queryProjectId =
            currentUrl.searchParams.get('PROJECTID') ||
            currentUrl.searchParams.get('project_id') ||
            currentUrl.searchParams.get('projectId');
        if (queryProjectId) {
            return decodeURIComponent(queryProjectId);
        }
        const pathMatch = currentUrl.pathname.match(/PROJ_[0-9a-zA-Z]+/);
        return pathMatch ? pathMatch[0] : '';
    } catch {
        return '';
    }
};

// 检测字符串是否为有效的网址
const isValidUrl = (string: string): boolean => {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
};

const EditableImg = ({ 
    src, 
    alt = '', 
    className, 
    propKey, 
    style,
    keywords,
    orientation = 'landscape'
}: EditableImgProps) => {
    const [imageSrc, setImageSrc] = useState<string | undefined>(src);
    const [imageAlt, setImageAlt] = useState<string | undefined>(alt);
    const [loading, setLoading] = useState<boolean>(false);
    const projectId = useMemo(() => extractProjectId(), []);

    useEffect(() => {
        setImageSrc(src);
    }, [src]);

    useEffect(() => {
        setImageAlt(alt);
    }, [alt]);

    // 新增：根据 keywords 获取图片
    useEffect(() => {
        if (!src && keywords) {
            // 检查 keywords 是否为有效的网址
            if (isValidUrl(keywords)) {
                // 如果是网址，直接使用
                setImageSrc(keywords);
            } else {
                // 如果不是网址，调用 get_image_url 函数
                setLoading(true);
                get_image_url(keywords, orientation, propKey, projectId || '').then(url => {
                    setImageSrc(url);
                    setLoading(false);
                }).catch(() => {
                    setLoading(false);
                });
            }
        }
    }, [keywords, src, orientation, propKey, projectId]);

    const sizeStyle: CSSProperties = className ? {} : { width: '100%', height: '100%' };
    const mergedStyle: CSSProperties = {
        ...sizeStyle,
        ...defaultStyle,
        ...style,
    };

    if (loading) {
        return (
            <div style={{...mergedStyle, display: 'flex', alignItems: 'center', justifyContent: 'center'}} key={propKey} className={className}>
                <LoadingOutlined />
            </div>
        );
    }

    return (
        <img
            style={mergedStyle}
            key={propKey}
            src={imageSrc}
            alt={imageAlt}
            className={className}
        />
    );
};

export default EditableImg;
