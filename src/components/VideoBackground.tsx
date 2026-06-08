import React, { useState, useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  // 视频源配置 - 用户需要在这里填写视频地址
  videoSrc: {
    // 8K视频地址（可选）
    src8k?: string;
    // 4K视频地址（可选）
    src4k?: string;
    // 2K视频地址（可选）
    src2k?: string;
    // 默认视频地址（必填，作为fallback）
    default: string;
  };
  // 视频是否自动播放（默认true）
  autoPlay?: boolean;
  // 视频是否静音（默认true，建议保持静音以获得更好的用户体验）
  muted?: boolean;
  // 视频是否循环播放（默认true）
  loop?: boolean;
  // 视频加载时显示的占位图（可选）
  placeholder?: string;
  // 遮罩层透明度 0-1（默认0.3）
  overlayOpacity?: number;
}

/**
 * VideoBackground组件 - 用于创建视频动态背景
 * 
 * 使用示例：
 * <VideoBackground
 *   videoSrc={{
 *     src8k: '您的8K视频地址',
 *     src4k: '您的4K视频地址',
 *     src2k: '您的2K视频地址',
 *     default: '您的默认视频地址'
 *   }}
 * >
 *   {children}
 * </VideoBackground>
 */
const VideoBackground: React.FC<VideoBackgroundProps> = ({
  videoSrc,
  autoPlay = true,
  muted = true,
  loop = true,
  placeholder,
  overlayOpacity = 0.3,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedSrc, setSelectedSrc] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // 根据设备性能和网络状况选择合适的视频源
  useEffect(() => {
    const selectVideoSource = () => {
      // 检测设备性能
      const isHighPerformance = navigator.hardwareConcurrency >= 8;
      
      // 检测网络状况
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const isFastNetwork = connection ? connection.effectiveType === '4g' : true;
      
      let selected = '';
      
      // 根据条件选择视频源
      if (isHighPerformance && isFastNetwork && videoSrc.src8k) {
        selected = videoSrc.src8k;
      } else if (isFastNetwork && videoSrc.src4k) {
        selected = videoSrc.src4k;
      } else if (videoSrc.src2k) {
        selected = videoSrc.src2k;
      } else {
        selected = videoSrc.default;
      }
      
      console.log('🎬 VideoBackground - 选择的视频源:', selected);
      console.log('🎬 VideoBackground - 视频配置:', videoSrc);
      setSelectedSrc(selected);
    };

    selectVideoSource();
  }, [videoSrc]);

  // 视频加载处理
  const handleLoadedData = () => {
    console.log('✅ VideoBackground - 视频加载成功');
    setIsLoaded(true);
    setHasError(false);
  };

  // 视频错误处理
  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('❌ VideoBackground - 视频加载失败:', e);
    setHasError(true);
    setIsLoaded(false);
    // 如果当前视频源加载失败，尝试降级到默认源
    if (selectedSrc !== videoSrc.default) {
      console.log('🔄 VideoBackground - 尝试降级到默认视频源');
      setSelectedSrc(videoSrc.default);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 占位图或加载提示 */}
      {(!isLoaded || hasError) && (
        <div className="absolute inset-0 z-0">
          {placeholder ? (
            <img
              src={placeholder}
              alt="Loading"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
              <div className="text-white text-center">
                <p className="text-lg mb-2">视频加载中...</p>
                <p className="text-sm opacity-70">视频源: {selectedSrc || '未设置'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 视频背景 */}
      {selectedSrc && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          onLoadedData={handleLoadedData}
          onError={handleError}
          style={{
            filter: 'brightness(0.8)', // 稍微降低亮度，让前景内容更清晰
          }}
        >
          <source src={selectedSrc} type="video/mp4" />
          您的浏览器不支持视频标签。
        </video>
      )}

      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
};

export default VideoBackground;
