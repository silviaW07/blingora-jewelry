'use client';

import React, { CSSProperties, useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import get_image_url from '@/tools/get-image-url';
import { DecorateFrame } from '@/frontend/decorate/DecorateFrame';
import { useDecorateMode } from '@/frontend/decorate/DecorateContext';
import { isDirectImageSrc, shouldBypassImageOptimizer } from '@/shared/imageUrl';
import { toProxiedImageUrl } from '@/frontend/utils/toProxiedImageUrl';


// 并发控制：后台列表多缩略图时 3 太低，容易排队假死
const MAX_CONCURRENT = 8;
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
    /** 主图超过该毫秒仍未加载成功时切到 fallbackSrc（首页类目卡：商品图慢则用分类主图） */
    slowFallbackMs?: number;
    /** Proxy / OSS resize hint for list thumbs (default 400). */
    proxyWidth?: number;
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
    slowFallbackMs = 0,
    proxyWidth = 400,
    loading = 'lazy',
    decoding = 'async',
    ...imgProps
}: EditableImgProps) => {
    const [imageSrc, setImageSrc] = useState<string | null | undefined>(src);
    const [imageAlt, setImageAlt] = useState<string | null | undefined>(alt);
    const [loadingState, setLoadingState] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);
    /** 0 = normal; 1 = force native <img> (skip /_next/image) before placeholder */
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [isFromKeywordSearch, setIsFromKeywordSearch] = useState<boolean>(false); // 新增状态
    const projectId = useMemo(() => extractProjectId(), []);
    const { getPatch } = useDecorateMode();
    const patch = getPatch(propKey);
    const overrideSrc = patch?.imageUrl?.trim() || '';

    useEffect(() => {
        if (slowFallbackMs > 0 && fallbackSrc && src && src !== fallbackSrc) {
            setImageSrc(fallbackSrc);
        } else {
            setImageSrc(src);
        }
        setHasError(false);
        setLoadAttempt(0);
        setIsFromKeywordSearch(false); // 来自 src prop 时,标记为非关键词搜索
    }, [src, fallbackSrc, slowFallbackMs]);

    useEffect(() => {
        if (overrideSrc) return;
        if (!(slowFallbackMs > 0) || !fallbackSrc || !src || src === fallbackSrc) return;

        setImageSrc(fallbackSrc);
        setHasError(false);
        setLoadingState(false);

        let cancelled = false;
        let settled = false;
        const img = new window.Image();
        const proxied = toProxiedImageUrl(src, { width: 400, quality: 75 }) || src;
        const timer = window.setTimeout(() => {
            settled = true;
            img.onload = null;
            img.onerror = null;
        }, slowFallbackMs);

        img.onload = () => {
            if (cancelled || settled) return;
            settled = true;
            window.clearTimeout(timer);
            setLoadAttempt(0);
            // Keep the sized/proxied URL — switching back to raw OSS/alicdn originals makes list cards crawl.
            setImageSrc(proxied);
        };
        img.onerror = () => {
            if (cancelled || settled) return;
            settled = true;
            window.clearTimeout(timer);
        };
        img.src = proxied;

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            img.onload = null;
            img.onerror = null;
        };
    }, [src, fallbackSrc, slowFallbackMs, overrideSrc]);

    useEffect(() => {
        setImageAlt(alt);
    }, [alt]);

    // 新增：根据 keywords 获取图片（带并发控制）
    useEffect(() => {
        if (overrideSrc) {
            setImageSrc(overrideSrc);
            setHasError(false);
            setIsFromKeywordSearch(false);
            setLoadingState(false);
            return;
        }
        if (src) {
            if (!(slowFallbackMs > 0 && fallbackSrc && src !== fallbackSrc)) {
                setImageSrc(src);
            }
            setHasError(false);
            setIsFromKeywordSearch(false);
            setLoadingState(false);
            return;
        }
        if (!keywords) {
            setImageSrc(fallbackSrc || null);
            setHasError(false);
            setLoadingState(false);
            return;
        }
        // 检查 keywords 是否为可直接使用的图片地址（含相对路径）
        if (isDirectImageSrc(keywords)) {
            setImageSrc(keywords);
            setHasError(false);
            setIsFromKeywordSearch(false);
            setLoadingState(false);
            return;
        }

        if (disableKeywordSearch) {
            setImageSrc(fallbackSrc || null);
            setHasError(false);
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
                        setHasError(false);
                        setIsFromKeywordSearch(true);
                    } else {
                        setImageSrc(fallbackSrc || null);
                        setHasError(false);
                    }
                    setLoadingState(false);
                }
            }).catch((err) => {
                if (!cancelled && err?.name !== 'AbortError') {
                    setImageSrc(fallbackSrc || null);
                    setHasError(false);
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
    }, [keywords, src, orientation, propKey, projectId, description, needLargeImage, overrideSrc, disableKeywordSearch, fallbackSrc, slowFallbackMs]);

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
            {(() => {
                const raw = imageSrc ?? fallbackSrc ?? undefined
                if (!raw) return null
                const proxied = toProxiedImageUrl(raw, { width: proxyWidth, quality: 80 }) || raw
                const useNativeImg =
                    shouldBypassImageOptimizer(proxied) ||
                    loadAttempt > 0 ||
                    /\.svg($|\?)/i.test(proxied)
                const imgStyle: CSSProperties = {
                    ...mergedStyle,
                    width: mergedStyle.width ?? '100%',
                    height: mergedStyle.height ?? '100%',
                    objectFit: (mergedStyle.objectFit as any) || 'cover',
                }
                const handleError = () => {
                    setLoadingState(false)
                    // Soft-retry chain before locking the broken placeholder:
                    // 1) native <img> (skip /_next/image)
                    // 2) unsized proxied / original CDN URL (fixes bad size suffixes / wrong proxy)
                    if (loadAttempt < 1 && imageSrc && imageSrc !== fallbackSrc) {
                        setLoadAttempt(1)
                        setHasError(false)
                        return
                    }
                    if (loadAttempt < 2 && src && imageSrc !== src) {
                        setLoadAttempt(2)
                        setHasError(false)
                        setImageSrc(src)
                        return
                    }
                    setHasError(true)
                    if (fallbackSrc && imageSrc !== fallbackSrc) {
                        setImageSrc(fallbackSrc)
                        setLoadAttempt(0)
                    }
                }

                if (useNativeImg) {
                    return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            {...(imgProps as any)}
                            key={`native-${loadAttempt}-${proxied}`}
                            referrerPolicy={imgProps.referrerPolicy ?? 'no-referrer'}
                            loading={loading}
                            decoding={decoding}
                            style={imgStyle}
                            src={proxied}
                            alt={imageAlt ?? ''}
                            className={className}
                            data-api-exclude-tracking={isFromKeywordSearch ? 'true' : undefined}
                            onError={handleError}
                        />
                    )
                }

                return (
                    <Image
                        {...(imgProps as any)}
                        key={`next-${loadAttempt}-${proxied}`}
                        referrerPolicy={imgProps.referrerPolicy ?? 'no-referrer'}
                        width={1200}
                        height={800}
                        sizes="(max-width: 768px) 100vw, 80vw"
                        priority={loading === 'eager'}
                        unoptimized={false}
                        style={imgStyle}
                        src={proxied}
                        alt={imageAlt ?? ''}
                        className={className}
                        data-api-exclude-tracking={isFromKeywordSearch ? "true" : undefined}
                        onError={handleError}
                    />
                )
            })()}
        </DecorateFrame>
    );
};

export default EditableImg;
export { EditableImg };
