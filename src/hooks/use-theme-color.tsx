"use client";

import * as React from "react";

/**
 * Custom hook to update the theme color for mobile status bar dynamically
 * @param color The color to set for the theme (e.g., "#21e09a", "#ffffff")
 * @param statusBarStyle The style for iOS status bar: "default" | "black" | "black-translucent"
 */
export function useThemeColor(
  color: string,
  statusBarStyle: "default" | "black" | "black-translucent" = "default"
): void {
  React.useEffect(() => {
    // 更新或创建 theme-color meta 标签
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement("meta");
      themeColorMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute("content", color);

    // 更新或创建 iOS 状态栏样式 meta 标签
    let statusBarMeta = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    if (!statusBarMeta) {
      statusBarMeta = document.createElement("meta");
      statusBarMeta.setAttribute("name", "apple-mobile-web-app-status-bar-style");
      document.head.appendChild(statusBarMeta);
    }
    statusBarMeta.setAttribute("content", statusBarStyle);

    // 清理函数（可选）
    return () => {
      // 如果需要在组件卸载时恢复默认颜色，可以在这里处理
    };
  }, [color, statusBarStyle]);
}