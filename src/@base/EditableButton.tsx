import React from "react";
import { Link } from 'react-router-dom';

// 定义 props 类型，扩展所有 button 元素的内置属性
interface EditableButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode; // 子节点内容，可选
    className?: string; // className，可选
    style?: React.CSSProperties; // 内联样式，可选
    propKey?: string; // 自定义 key 属性
    href?: string;
}

// EditableButton: 可编辑的按钮文本
export default function EditableButton({
    children,
    className = "",
    style,
    propKey,
    href,
    ...rest // 解构其余的 button 原生属性
}: EditableButtonProps) {
    // 创建按钮元素
    const buttonElement = (
        <button
            className={className}
            style={{
                ...style,
                ...(href ? { cursor: 'pointer' } : {}),
            }}
            key={propKey}
            {...rest} // 将剩余的 button 属性传递给原生 button 元素
        >
            {children}
        </button>
    );

    // 如果是锚点链接（以 # 开头），使用原生 a 标签
    if (href && href.startsWith('#')) {
        return (
            <a href={href}>
                {buttonElement}
            </a>
        );
    }
    
    // 如果是外部链接或路由链接，使用 React Router 的 Link
    if (href) {
        return <Link to={href}>{buttonElement}</Link>;
    }
    
    // 如果没有 href，直接返回按钮
    return buttonElement;
}