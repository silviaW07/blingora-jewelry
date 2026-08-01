import React, { ReactNode } from "react";
import { Carousel as ResponsiveCarousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // 必须导入样式

interface CarouselProps {
  autoplay?: boolean; // 是否自动播放
  cellAlign?: "left" | "center" | "right"; // 图片对齐方式
  wrapAround?: boolean; // 是否循环播放
  withoutControls?: boolean; // 是否隐藏控制箭头
  cellSpacing?: number; // 图片之间的间距
  slidesToShow?: number; // 每次显示的图片数量
  speed?: number; // 动画过渡时间（毫秒）
  children: ReactNode; // 子元素（图片列表）
}

const Carousel: React.FC<CarouselProps> = ({
  autoplay = true,
  wrapAround = true,
  withoutControls = true,
  slidesToShow = 2,
  speed = 800,
  children,
}) => {
  // 从 children 中获取所有的图片项
  const images = React.Children.toArray(children);

  return (
    <ResponsiveCarousel
      autoPlay={autoplay}
      centerMode={true}
      centerSlidePercentage={100 / slidesToShow} // 计算每张图片的宽度百分比
      infiniteLoop={wrapAround}
      showArrows={!withoutControls}
      showStatus={false}
      showThumbs={false}
      dynamicHeight={true}
      emulateTouch={true}
      interval={3000} // 自动播放间隔时间
      transitionTime={speed} // 动画过渡时间
      className="carousel-container"
    >
      {images.map((image, index) => (
        <div
          key={index}
          className="carousel-item relative group w-full h-[20rem] overflow-hidden bg-origin-content rounded-2xl md:h-[35rem] md:mt-0 md:rounded-3xl"
        >
          {image}
        </div>
      ))}
    </ResponsiveCarousel>
  );
};

export default Carousel;