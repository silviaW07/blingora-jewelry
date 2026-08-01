'use client';

import React, { CSSProperties, useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import get_image_url from '../../src/tools/tools';
import { DecorateFrame } from '@/frontend/decorate/DecorateFrame';
import { useDecorateMode } from '@/frontend/decorate/DecorateContext';
import { isDirectImageSrc } from '@/shared/imageUrl';


// 并发控制：最多同时 3 个图片请求
const MAX_CONCURRENT = 3;
const KEYWORD_IMAGE_TIMEOUT_MS = 4000;
let activeCount = 0;
const waitQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
    if (activeCount < MAX_CONCURRENT) {
        activeCount++;
        return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
        waitQueue.push(() => {
            activeCount++;
            resolve();
        });
    });
}

function releaseSlot(): void {
    activeCount--;
    if (waitQueue.length > 0) {
        const next = waitQueue.shift()!;
        next();
    }
}

// 内存缓存：避免相同 keywords 重复请求
const imageCache = new Map<string, string>();

function getCacheKey(keywords: string, orientation: string, propKey: string): string {
    return `${keywords}|${orientation}|${propKey}`;
}

function withTimeout<T>(promise: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(Object.assign(new Error('Image keyword lookup timeout'), { name: 'TimeoutError' }));
        }, ms);
        const onAbort = () => {
            clearTimeout(timer);
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        };
        if (signal?.aborted) {
            onAbort();
            return;
        }
        signal?.addEventListener('abort', onAbort, { once: true });
        promise.then(
            (value) => {
                clearTimeout(timer);
                signal?.removeEventListener('abort', onAbort);
                resolve(value);
            },
            (error) => {
                clearTimeout(timer);
                signal?.removeEventListener('abort', onAbort);
                reject(error);
            },
        );
    });
}

interface EditableImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
    propKey: string;             // 必须传入的唯一标识符
    src?: string | null;         // 图片源，支持 null
    alt?: string | null;         // 图片描述，支持 null
    keywords?: string | null;    // 用于关键词获取图片
    description?: string | null; // 图片详细描述
    needLargeImage?: boolean;    // 是否需要大图
    orientation?: 'landscape' | 'portrait' | 'square'; // 图片方向
    /** 关闭外链关键词搜图（首页类目卡等场景应关闭，避免长时间转圈） */
    disableKeywordSearch?: boolean;
    fallbackSrc?: string | null;
}

const defaultStyle: CSSProperties = {
    objectFit: 'cover',
    aspectRatio: '16 / 9', // 默认宽高比
    width: '100%', 
    height: '100%'
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

const EditableImg = ({ 
    src, 
    alt = '', 
    className, 
    propKey, 
    style,
    keywords,
    description,
    needLargeImage=false,
    orientation = 'landscape',
    disableKeywordSearch = false,
    fallbackSrc = null,
    loading = 'lazy',
    decoding = 'async',
    ...imgProps
}: EditableImgProps) => {
    const [imageSrc, setImageSrc] = useState<string | null | undefined>(src);
    const [imageAlt, setImageAlt] = useState<string | null | undefined>(alt);
    const [loadingState, setLoadingState] = useState<boolean>(false);
    const [isFromKeywordSearch, setIsFromKeywordSearch] = useState<boolean>(false); // 新增状态
    const projectId = useMemo(() => extractProjectId(), []);
    const { getPatch } = useDecorateMode();
    const patch = getPatch(propKey);
    const overrideSrc = patch?.imageUrl?.trim() || '';

    useEffect(() => {
        setImageSrc(src);
        setIsFromKeywordSearch(false); // 来自 src prop 时,标记为非关键词搜索
    }, [src]);

    useEffect(() => {
        setImageAlt(alt);
    }, [alt]);

    // 新增：根据 keywords 获取图片（带并发控制）
    useEffect(() => {
        if (overrideSrc) {
            setImageSrc(overrideSrc);
            setIsFromKeywordSearch(false);
            setLoadingState(false);
            return;
        }
        if (src) {
            setImageSrc(src);
            setIsFromKeywordSearch(false);
            setLoadingState(false);
            return;
        }
        if (!keywords) {
            setImageSrc(fallbackSrc || null);
            setLoadingState(false);
            return;
        }
        // 检查 keywords 是否为可直接使用的图片地址（含相对路径）
        if (isDirectImageSrc(keywords)) {
            setImageSrc(keywords);
            setIsFromKeywordSearch(false);
            setLoadingState(false);
            return;
        }

        if (disableKeywordSearch) {
            setImageSrc(fallbackSrc || null);
            setIsFromKeywordSearch(false);
            setLoadingState(false);
            return;
        }

        // 如果不是网址，排队获取图片
        const cacheKey = getCacheKey(keywords, orientation, propKey);
        const cached = imageCache.get(cacheKey);
        if (cached) {
            setImageSrc(cached);
            setIsFromKeywordSearch(true);
            setLoadingState(false);
            return;
        }

        const abortController = new AbortController();
        let cancelled = false;

        acquireSlot().then(() => {
            if (cancelled) {
                releaseSlot();
                return;
            }
            // 拿到 slot 后才显示 loading，避免大量组件同时 spin
            setLoadingState(true);
            return withTimeout(
                get_image_url(keywords || description || '', orientation, propKey, projectId || '', description || '', needLargeImage, abortController.signal),
                KEYWORD_IMAGE_TIMEOUT_MS,
                abortController.signal,
            ).then(url => {
                if (!cancelled) {
                    const safeUrl = isDirectImageSrc(url) ? url : (fallbackSrc || null);
                    if (safeUrl) {
                        imageCache.set(cacheKey, safeUrl);
                        setImageSrc(safeUrl);
                        setIsFromKeywordSearch(true);
                    } else {
                        setImageSrc(fallbackSrc || null);
                    }
                    setLoadingState(false);
                }
            }).catch((err) => {
                if (!cancelled && err?.name !== 'AbortError') {
                    setImageSrc(fallbackSrc || null);
                    setLoadingState(false);
                }
            }).finally(() => {
                releaseSlot();
            });
        });

        return () => {
            cancelled = true;
            abortController.abort();
        };
    }, [keywords, src, orientation, propKey, projectId, description, needLargeImage, overrideSrc, disableKeywordSearch, fallbackSrc]);

    const mergedStyle: CSSProperties = {
        ...defaultStyle,
        ...style,
        ...(patch?.fontSize ? { fontSize: `${patch.fontSize}px` } : null),
        ...(typeof patch?.padding === 'number' ? { padding: `${patch.padding}px` } : null),
        ...(patch?.backgroundColor ? { backgroundColor: patch.backgroundColor } : null),
    };

    if (loadingState) {
        return (
            <DecorateFrame propKey={propKey} kind="image" className={className} style={{...mergedStyle, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{...mergedStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'}} className={className}>
                    <Loader2 className="animate-spin" style={{ willChange: 'transform' }} />
                </div>
            </DecorateFrame>
        );
    }

    return (
        <DecorateFrame propKey={propKey} kind="image" className={className} style={mergedStyle}>
            <img
                {...imgProps}
                loading={loading}
                decoding={decoding}
                style={mergedStyle}
                src={imageSrc ?? fallbackSrc ?? undefined}
                alt={imageAlt ?? undefined}
                className={className}
                data-api-exclude-tracking={isFromKeywordSearch ? "true" : undefined}
            />
        </DecorateFrame>
    );
};

export default EditableImg;
export { EditableImg };
