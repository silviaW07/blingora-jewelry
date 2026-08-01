'use client'

import React, { Component } from 'react'
import { Button } from '@/components/ui/button'

/**
 * 确保数据可序列化（用于 postMessage / 上报）
 */
export function ensureSerializable(data: unknown): unknown {
  try {
    JSON.stringify(data)
    return data
  } catch {
    if (typeof data === 'object' && data !== null) {
      const simplified: Record<string, unknown> = {}
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          try {
            const value = (data as Record<string, unknown>)[key]
            if (
              typeof value === 'string' ||
              typeof value === 'number' ||
              typeof value === 'boolean'
            ) {
              simplified[key] = value
            } else if (value === null || value === undefined) {
              simplified[key] = value
            } else if (Array.isArray(value)) {
              simplified[key] = value.map((item) =>
                typeof item === 'object' && item !== null ? '[Object]' : item
              )
            } else if (typeof value === 'object') {
              simplified[key] = '[Object]'
            }
          } catch {
            simplified[key] = '[Unserializable]'
          }
        }
      }
      return simplified
    }
    return '[Unserializable]'
  }
}

const DEFAULT_SKIP_FILES = ['error.tsx', 'PageErrorBoundary']

/**
 * 从 Error.stack 中提取源码位置（用于上报/展示）
 */
export function extractSourceLocation(
  error: Error,
  skipFiles: string[] = DEFAULT_SKIP_FILES
): {
  function: string
  file: string
  line: number
  column: number
  id: string
} | null {
  try {
    const stack = error.stack
    if (!stack) return null
    const lines = stack.split('\n')
    for (const line of lines) {
      const shouldSkip = skipFiles.some((name) => line.includes(name))
      if (shouldSkip) continue
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/)
      if (match) {
        const file = match[2]
        if (file && !skipFiles.some((name) => file.includes(name))) {
          return {
            function: match[1],
            file,
            line: parseInt(match[3], 10),
            column: parseInt(match[4], 10),
            id: `${file}:${match[3]}:${match[4]}`,
          }
        }
      }
      const webpackMatch = line.match(/at\s+(.+?)\s+\((.+?\.tsx?):(\d+):(\d+)\)/)
      if (webpackMatch) {
        const file = webpackMatch[2]
        if (file && !skipFiles.some((name) => file.includes(name))) {
          return {
            function: webpackMatch[1],
            file,
            line: parseInt(webpackMatch[3], 10),
            column: parseInt(webpackMatch[4], 10),
            id: `${webpackMatch[2]}:${webpackMatch[3]}:${webpackMatch[4]}`,
          }
        }
      }
    }
    return null
  } catch {
    return null
  }
}


export interface PageErrorBoundaryProps {
  children: React.ReactNode
  /** 点击「返回首页」时跳转的路径，默认 `/` */
  homeHref?: string
  /** 自定义返回操作（优先级最高），通常传 router.back() */
  onGoBack?: () => void
}

interface PageErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}



export class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  constructor(props: PageErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<PageErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
  }

  handleFix = () => {
    const { error, errorInfo } = this.state
    if (!error) return
    const sourceLocation = extractSourceLocation(error)
    const logData = {
      type: 'error:react',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo?.componentStack ?? '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now(),
      sourceLocation,
      context: { name: error.name, message: error.message },
    }
    const serializable = ensureSerializable(logData)
    try {
      if (typeof window !== 'undefined' && window.parent) {
        window.parent.postMessage(serializable, '*')
      }
    } catch (e) {
      console.warn('Failed to send error via postMessage:', e)
    }
  }

  handleBackHome = () => {
    if (typeof window === 'undefined') return

    // 优先使用外部传入的返回操作（如 router.back()）
    if (this.props.onGoBack) {
      this.props.onGoBack()
      return
    }

    // fallback：同源 referrer 则浏览器后退，否则跳首页（拼接 basePath）
    const referrer = document.referrer
    try {
      if (referrer && new URL(referrer).origin === window.location.origin) {
        window.history.back()
        return
      }
    } catch {
      // referrer 解析失败，走兜底
    }

    const base = (window as any).__dynamic_base__ || ''
    const homeHref = this.props.homeHref ?? '/'
    window.location.href = (base === '/' ? '' : base) + homeHref
  }

  render() {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children
    }
    const { error } = this.state

    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-2xl">
          <p className="text-destructive text-lg font-medium">
            Page rendering error
          </p>
          <p className="text-muted-foreground text-sm font-medium">
            {error.name}: {error.message}
          </p>

          <div className="flex gap-3 mt-2">
            <Button
              variant="default"
              size="sm"
              className="px-4 py-2"
              onClick={this.handleFix}
            >
              fix
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-4 py-2"
              onClick={this.handleBackHome}
            >
              go back
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
