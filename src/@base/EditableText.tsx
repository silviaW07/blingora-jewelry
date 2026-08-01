'use client'
import React, { useState, useEffect } from "react";
import { DecorateFrame } from '@/frontend/decorate/DecorateFrame';
import { useDecorateMode } from '@/frontend/decorate/DecorateContext';

interface EditableTextProps {
    className?: string;
    propKey?: string;
    children?: string;
}

const EditableText: React.FC<EditableTextProps & React.HTMLAttributes<HTMLDivElement>> = ({
    propKey,
    className,
    children = "",
    style,
    ...rest
}) => {
    const [text, setText] = useState<string>("");
    const [link, setLink] = useState<string>("");
    const { isDecorateMode, getPatch } = useDecorateMode();
    const key = propKey || 'editable-text-anonymous';
    const patch = getPatch(key);

    useEffect(() => {
        let temp_text = children
        if (typeof children !== 'string') {
            // @ts-ignore
            temp_text = children[0] || '';
        }

        if (typeof temp_text === 'string' && temp_text.includes("&")) {
            const params = new URLSearchParams(temp_text);
            const text_param = params.get('text');
            const link_param = params.get('link');
            const new_text = text_param ? text_param : temp_text.split("&")[0];
            setText(new_text);
            setLink(link_param ? link_param : "");
        } else {
            setText(String(temp_text ?? ''));
        }
    }, [children]);

    const displayText = typeof patch?.text === 'string' && patch.text.length > 0 ? patch.text : text;

    const content = (
        <div
            onClick={(e) => {
                if (isDecorateMode) return;
                if (link && typeof window !== 'undefined') {
                    window.location.href = link;
                }
            }}
            className={className}
            style={{
                ...style,
                cursor: link && !isDecorateMode ? "pointer" : style?.cursor,
                ...(patch?.fontSize ? { fontSize: `${patch.fontSize}px` } : null),
                ...(patch?.color ? { color: patch.color } : null),
                ...(patch?.backgroundColor ? { backgroundColor: patch.backgroundColor } : null),
                ...(typeof patch?.padding === 'number' ? { padding: `${patch.padding}px` } : null),
            }}
            data-link={link}
            {...rest}
        >
            {displayText}
        </div>
    );

    if (!propKey) return content;

    return (
        <DecorateFrame propKey={propKey} kind="text">
            {content}
        </DecorateFrame>
    );
};

export default EditableText;
