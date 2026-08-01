import React, { useState, useEffect, CSSProperties } from "react";

interface OverflowProps<T> {
    data: T[]; // 数据列表，类型为泛型 T
    style?: CSSProperties; // 自定义样式
    className?: string; // 自定义类名
    renderItem: (item: T, index: number) => React.ReactNode; // 渲染每个可见项的函数
    maxCount: number; // 最大显示的项数
    minCount?: number; // 最小显示的项数，默认为 1
    renderRest?: (restItems: T[]) => React.ReactNode; // 渲染剩余项的函数
    onUpdate?: (visibleItems: T[], restItems: T[]) => void; // 更新时的回调函数
}

const Overflow = <T,>({
    data,
    style,
    className,
    renderItem,
    maxCount,
    renderRest,
    onUpdate,
}: OverflowProps<T>) => {
    const [visibleItems, setVisibleItems] = useState<T[]>(data.slice(0, maxCount));
    const [restItems, setRestItems] = useState<T[]>(data.slice(maxCount));

    // 监听数据变化并更新显示的内容
    useEffect(() => {
        const newVisibleItems = data.slice(0, maxCount);
        const newRestItems = data.slice(maxCount);
        setVisibleItems(newVisibleItems);
        setRestItems(newRestItems);

        // 触发更新回调
        if (onUpdate) {
            onUpdate(newVisibleItems, newRestItems);
        }
    }, [data, maxCount, onUpdate]);
    return (
        <div className={className} style={style}>
            <div className="overflow-container flex items-center">
                {/* 渲染可见项 */}
                {visibleItems.map((item, index) => (
                    <div key={index} className="overflow-item">
                        {renderItem(item, index)}
                    </div>
                ))}

                {/* 渲染剩余项 */}
                {restItems.length > 0 && (
                    <div className="overflow-rest">
                        {renderRest ? renderRest(restItems) : `+${restItems.length} more`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Overflow;