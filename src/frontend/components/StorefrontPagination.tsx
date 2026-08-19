'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface StorefrontPaginationProps {
  /** 当前页（1 起） */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总条数 */
  total: number;
  /** 总页数（可选，未传则用 total/pageSize 计算） */
  totalPages?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  /** 每页可选项，默认 [20, 40, 60, 80] */
  pageSizeOptions?: number[];
  className?: string;
}

type PageToken = number | 'ellipsis-left' | 'ellipsis-right';

/**
 * 电商风格标准分页器：居中、方框按钮、当前页高亮、< > 箭头、页码窗口化省略号、每页数量选择器。
 * 网页端与移动端 H5 共用。
 */
function buildPageTokens(current: number, total: number): PageToken[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-right', total];
  }
  if (current >= total - 3) {
    return [1, 'ellipsis-left', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'ellipsis-left', current - 1, current, current + 1, 'ellipsis-right', total];
}

export const StorefrontPagination = ({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 40, 60, 80],
  className,
}: StorefrontPaginationProps) => {
  const { t } = useTranslation();
  const computedTotalPages = Math.max(1, totalPages ?? Math.ceil(total / Math.max(1, pageSize)));
  const currentPage = Math.min(Math.max(1, page), computedTotalPages);

  const goTo = (next: number) => {
    const target = Math.min(Math.max(1, next), computedTotalPages);
    if (target !== currentPage) onPageChange(target);
  };

  if (computedTotalPages <= 1 && !onPageSizeChange) return null;

  const tokens = buildPageTokens(currentPage, computedTotalPages);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= computedTotalPages;

  const boxBase =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors select-none';

  return (
    <nav
      role="navigation"
      aria-label={t('pagination.label', { defaultValue: 'Pagination' })}
      className={`mt-8 flex w-full flex-wrap items-center justify-center gap-2 ${className || ''}`}
    >
      <button
        type="button"
        aria-label={t('pagination.previous', { defaultValue: 'Previous page' })}
        onClick={() => goTo(currentPage - 1)}
        disabled={isFirst}
        className={`${boxBase} border-[#e3ddd0] bg-white text-[#4a4a4a] hover:border-[#93c5fd] hover:text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#e3ddd0] disabled:hover:text-[#4a4a4a]`}
      >
        <ChevronLeft className="size-4" />
      </button>

      {tokens.map((token) => {
        if (token === 'ellipsis-left' || token === 'ellipsis-right') {
          return (
            <span
              key={token}
              aria-hidden
              className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-sm text-[#9a948a]"
            >
              …
            </span>
          );
        }
        const active = token === currentPage;
        return (
          <button
            key={token}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => goTo(token)}
            className={
              active
                ? `${boxBase} border-[#60a5fa] bg-[#eff6ff] text-[#2563eb]`
                : `${boxBase} border-[#e3ddd0] bg-white text-[#4a4a4a] hover:border-[#93c5fd] hover:text-[#2563eb]`
            }
          >
            {token}
          </button>
        );
      })}

      <button
        type="button"
        aria-label={t('pagination.next', { defaultValue: 'Next page' })}
        onClick={() => goTo(currentPage + 1)}
        disabled={isLast}
        className={`${boxBase} border-[#e3ddd0] bg-white text-[#4a4a4a] hover:border-[#93c5fd] hover:text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#e3ddd0] disabled:hover:text-[#4a4a4a]`}
      >
        <ChevronRight className="size-4" />
      </button>

      {onPageSizeChange ? (
        <div className="relative ml-1">
          <select
            aria-label={t('pagination.pageSize', { defaultValue: 'Items per page' })}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={`${boxBase} cursor-pointer appearance-none border-[#e3ddd0] bg-white pr-7 text-[#4a4a4a] hover:border-[#93c5fd]`}
          >
            {(pageSizeOptions.includes(pageSize) ? pageSizeOptions : [...pageSizeOptions, pageSize].sort((a, b) => a - b)).map(
              (size) => (
                <option key={size} value={size}>
                  {t('pagination.perPage', { defaultValue: '{{count}} / page', count: size })}
                </option>
              ),
            )}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#9a948a]" />
        </div>
      ) : null}
    </nav>
  );
};

export default StorefrontPagination;
