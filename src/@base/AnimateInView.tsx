import { motion } from "framer-motion";
import React, { ReactNode } from "react";

// 定义动画类型
type AnimationType = "rise" | "fade";

interface AnimateInViewProps {
    type?: AnimationType; // 动画类型（"rise" 或 "fade"）
    children?: ReactNode; // 子元素
}

const AnimateInView: React.FC<AnimateInViewProps> = ({ type = 'rise', children }) => {
    const variants = {
        rise: { opacity: 0, y: 20, transition: { duration: 0.6 } },
        fade: { opacity: 0, transition: { duration: 0.6 } },
    };

    return (
        <motion.div
            initial={variants[type]} // 初始动画
            whileInView={{ opacity: 1, y: 0 }} // 当进入视图时的动画
            viewport={{ once: true }} // 确保动画只触发一次
        >
            {children}
        </motion.div>
    );
};

export default AnimateInView;