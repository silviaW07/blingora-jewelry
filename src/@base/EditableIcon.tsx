import React from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome'
import * as faBrandsIcons from "@fortawesome/free-brands-svg-icons";
import * as faSolidIcons from "@fortawesome/free-solid-svg-icons";
import * as faRegularIcons from "@fortawesome/free-regular-svg-icons";
const formatIconName = (iconName: string) => {
  return iconName
    .split('-') // 按 '-' 分割字符串
    .map((part, index) =>
      index === 0
        ? part // 第一个部分保持原样
        : part.charAt(0).toUpperCase() + part.slice(1) // 其他部分首字母大写
    )
    .join(''); // 将数组重新组合成字符串
};


// 动态导入 FontAwesome 图标
const dynamicImportFontAwesomeIcon = (iconClassName: string) => {
  const [iconType, iconName] = iconClassName.split(" ");

  // 图标库映射表
  const iconLibraries: Record<string, any> = {
    "fa-brands": faBrandsIcons,
    "fa-solid": faSolidIcons,
    "fa-regular": faRegularIcons,
  };

  const iconLibrary = iconLibraries[iconType];
  if (!iconLibrary) return null;

  // 转换图标名称，例如 "fa-twitter" => "faTwitter"
  const iconKey = formatIconName(iconName);
  const icon = iconLibrary[iconKey];
  console.log('iconKey', iconKey, icon)

  if (!icon) return null;
  // 返回图标作为 React 组件
  return (props: any) => <FontAwesomeIcon {...props} icon={icon}></FontAwesomeIcon>;;
};

// 定义 `EditableIcon` 的 props 类型
interface EditableIconProps {
  propKey?: string; // 可选的 propKey，用于标识
  icon?: string; // 可选的图标名称
  className?: string; // 可选的样式类名
  iconLibrary?: "FontAwesome" | "Lucide"; // 可选的图标库，默认 Lucide
  style?: React.CSSProperties; // 可选的内联样式
}

// EditableIcon 组件
const EditableIcon: React.FC<EditableIconProps> = ({
  propKey,
  icon,
  className,
  iconLibrary = "Lucide",
  style,
}) => {
  // 如果没有传入图标名称，返回 null
  if (!icon) return null;

  // 如果使用 FontAwesome 图标库
  if (iconLibrary === "FontAwesome") {
    const DynamicIconComponent = dynamicImportFontAwesomeIcon(icon);
    if (!DynamicIconComponent) return null;
    return (
      <DynamicIconComponent
        key={propKey}
        className={className}
        style={style}
      />
    );
  }

  // 如果使用 Lucide 图标库
  return (
    <div className={className} key={propKey} style={style}>
      <DynamicIcon name={icon as any} />
    </div>
  );
};

export default EditableIcon;