import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from "react-router-dom";
import GRoud404SVG from '../assets/GRoud404SVG.svg'

// 错误信息接口
interface CustomErrorInfo {
  error: Error;
  errorInfo?: React.ErrorInfo;
  timestamp: number;
  url: string;
  userAgent: string;
  stack?: string;
  sourceLocation?: any;
  elementInfo?: any;
  errorInfoComponentStack?: string|null;
  errorType: 'react' | 'javascript' | 'promise' | 'resource';
  context?: any;
}

// 错误边界状态接口
interface CustomErrorBoundaryState {
  hasError: boolean;
  errorInfo: CustomErrorInfo | null;
  isExpanded: boolean;
  isLoading: boolean;
}

// 工具函数：确保数据可序列化
const ensureSerializable = (data: any): any => {
  try {
    // 测试数据是否可以被序列化
    JSON.stringify(data);
    return data;
  } catch (error) {
    // 如果无法序列化，返回一个简化的版本
    if (typeof data === 'object' && data !== null) {
      const simplified: any = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          try {
            const value = data[key];
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              simplified[key] = value;
            } else if (value === null || value === undefined) {
              simplified[key] = value;
            } else if (Array.isArray(value)) {
              simplified[key] = value.map(item => 
                typeof item === 'object' ? '[Object]' : item
              );
            } else if (typeof value === 'object') {
              simplified[key] = '[Object]';
            }
          } catch {
            simplified[key] = '[Unserializable]';
          }
        }
      }
      return simplified;
    }
    return '[Unserializable]';
  }
};

// 自定义 ProLayout 错误边界组件
class CustomProLayoutErrorBoundary extends Component<{
  children: ReactNode;
  siteName?: string;
  logo?: string | React.ReactNode;
  onError?: (error: CustomErrorInfo) => void;
  // ProLayout 传递的属性
  error?: Error;
  errorInfo?: React.ErrorInfo;
  navigate?: (path: string) => void;
  isLoading?: boolean;
}, CustomErrorBoundaryState> {

  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      errorInfo: null,
      isExpanded: false,
      isLoading: false
      };
  }

  static getDerivedStateFromError(error: Error): Partial<CustomErrorBoundaryState> {
    return {
      hasError: true,
      errorInfo: {
        error,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        stack: error.stack,
        errorType: 'react'
      }
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 提取源码位置信息
    const sourceLocation = this.extractSourceLocation(error);
    
    // 提取元素信息

    const fullErrorInfo: CustomErrorInfo = {
      error,
      errorInfo,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      stack: error.stack,
      sourceLocation,
      errorType: 'react',
      errorInfoComponentStack: errorInfo.componentStack,
      context: {
        componentStack: errorInfo.componentStack
      }
    };

    this.setState({ errorInfo: fullErrorInfo });

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(fullErrorInfo);
    }



  }

  private extractSourceLocation(error: Error): any {
    try {
      // 优先从错误堆栈中提取，这样可以避免获取到错误边界 UI 本身的元素
      const stack = error.stack;
      if (stack) {
        const lines = stack.split('\n');
        for (const line of lines) {
          // 跳过错误边界相关的堆栈行
          if (line.includes('ProLayoutErrorBoundary') || line.includes('ErrorBoundary')) {
            continue;
          }

          // 匹配源码映射信息
          const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
          if (match) {
            const file = match[2];
            // 跳过错误边界文件本身
            if (file && !file.includes('ProLayoutErrorBoundary')) {
              return {
                function: match[1],
                file: file,
                line: parseInt(match[3]),
                column: parseInt(match[4]),
                id: `${file}:${match[3]}:${match[4]}`
              };
            }
          }

          // 也尝试匹配 webpack:// 格式的源码映射
          const webpackMatch = line.match(/at\s+(.+?)\s+\((.+?\.tsx?):(\d+):(\d+)\)/);
          if (webpackMatch) {
            const file = webpackMatch[2];
            if (file && !file.includes('ProLayoutErrorBoundary')) {
              return {
                function: webpackMatch[1],
                file: file,
                line: parseInt(webpackMatch[3]),
                column: parseInt(webpackMatch[4]),
                id: `${file}:${webpackMatch[3]}:${webpackMatch[4]}`
              };
            }
          }
        }
      }

      // 如果堆栈中没有找到，再尝试从 DOM 元素中获取源码映射信息
      // 但要排除错误边界 UI 本身的元素
      const sourceLocation = this.extractSourceLocationFromDOM();
      if (sourceLocation) {
        // 确保不是错误边界文件本身
        if (sourceLocation.file && !sourceLocation.file.includes('ProLayoutErrorBoundary')) {
          return sourceLocation;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private extractSourceLocationFromDOM(): any {
    try {
      // 查找包含源码映射信息的元素
      const elementsWithSourceMap = document.querySelectorAll('[data-source-file]');
      
      if (elementsWithSourceMap.length > 0) {
        // 优先使用当前激活的元素
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.hasAttribute('data-source-file')) {
          return this.extractSourceInfoFromElement(activeElement);
        }
        
        // 如果没有激活元素，使用第一个有源码映射的元素
        const firstElement = elementsWithSourceMap[0] as HTMLElement;
        return this.extractSourceInfoFromElement(firstElement);
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to extract source location from DOM:', error);
      return null;
    }
  }

  private extractSourceInfoFromElement(element: HTMLElement): any {
    try {
      const sourceFile = element.getAttribute('data-source-file');
      const sourceLine = element.getAttribute('data-source-line');
      const sourceColumn = element.getAttribute('data-source-column');
      const sourceName = element.getAttribute('data-source-name');
      const sourceId = element.getAttribute('data-source-id');
      
      if (sourceFile) {
        return {
          file: sourceFile,
          line: sourceLine ? parseInt(sourceLine) : 0,
          column: sourceColumn ? parseInt(sourceColumn) : 0,
          name: sourceName || 'Unknown',
          id: sourceId || '',
          element: element.tagName.toLowerCase(),
          className: element.className || ''
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleFix = (): void => {
    const { errorInfo } = this.state;
    this.setState({ isLoading: true });
    if (!errorInfo) {
      return;
    }
    this.setState({ isLoading: true });

    // 构建错误日志数据
    const logData = {
      type: 'error:react',
      error: {
        name: errorInfo.error.name,
        message: errorInfo.error.message,
        stack: errorInfo.error.stack
      },
      url: errorInfo.url,
      userAgent: errorInfo.userAgent,
      timestamp: errorInfo.timestamp,
      sourceLocation: errorInfo.sourceLocation,
      errorType: errorInfo.errorType,
      errorInfoComponentStack: errorInfo.errorInfoComponentStack,
      context: errorInfo.context
    };

    // 创建可序列化的错误信息
    const serializableErrorInfo = ensureSerializable(logData);
console.log('serializableErrorInfo', serializableErrorInfo);
    try {
      window.parent.postMessage(serializableErrorInfo, '*');
    } catch (error) {
      console.warn('Failed to send error via postMessage:', error);
    }
    setTimeout(() => {
      this.setState({ isLoading: false });
    }, 1000);
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI(): ReactNode {
    const { errorInfo, isExpanded, isLoading } = this.state;
    const {  siteName, logo, navigate } = this.props;

    const handleTargetHome = () => {
      // 使用 window.location.href 进行完整页面跳转，确保错误边界被完全重置
      if (navigate) {
        navigate('/');
      }
    }
    if (!errorInfo) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-medium">An unknown error has occurred</span>
            <Button size="sm" onClick={this.handleReload}>
              Reload
            </Button>
          </div>
          <p className="text-red-500 text-sm mt-2">The application encountered an error, but detailed information could not be obtained.</p>
        </div>
      );
    }

    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5',
        height: '100%',
        width: '100%'
      }}>
         <div className="flex flex-col gap-2 items-center left-2/4 top-2/4 absolute justify-center w-screen h-screen opacity-0 notFound  transition-opacity duration-300" style={{
            transform:'translate(-50%, -50%)',
            fontFamily:"'DINCondensedBold', sans-serif"
        }}>
            <div className="relative w-full max-w-[600px] aspect-[4/3] ">
                <img 
                    src={GRoud404SVG} 
                    alt="404 illustration" 
                    className="w-full h-full object-contain"
                    onLoad={() => {
                        const target = document.querySelector('.notFound') as HTMLElement;
                        if(target){
                            target.style.opacity = '1';
                        }
                     
                    }}
                />
            </div>
            <p className='text-[56px] font-bold'>404</p>
            <div className="flex gap-4 mt-8">
              <Button
                className='w-[140px] cursor-pointer'
                onClick={handleTargetHome}
              >
                Back Homepage
              </Button>

            </div>
        </div>
      </div>
    );
  }
};

// 创建一个包装器组件来提供 navigate 函数
const ProLayoutErrorBoundaryWrapper: React.FC<{
  children: ReactNode;
  siteName?: string;
  logo?: string | React.ReactNode;
  onError?: (error: CustomErrorInfo) => void;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}> = (props) => {
  const navigate = useNavigate();
  
  return (
    <CustomProLayoutErrorBoundary 
      {...props} 
      navigate={navigate}
    />
  );
};

export default ProLayoutErrorBoundaryWrapper;
export type { CustomErrorInfo }; 