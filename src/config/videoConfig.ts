export const videoBackgroundConfig = {
  // 登录页面视频背景配置
  login: {
    // 8K视频地址
    src8k: './public/videos/4月13日.mp4', 
    
    // 4K视频地址
    src4k: './public/videos/4月13日.mp4', 
    
    // 2K视频地址
    src2k: './public/videos/4月13日.mp4', 
    
    // 默认视频地址
    default: './public/videos/4月13日.mp4', 
    
    // 占位图地址
    placeholder: '',
    
    // 遮罩层透明度
    overlayOpacity: 0.3,
  },
  
  // 其他页面的视频背景配置
  // home: {
  //   src8k: '',
  //   src4k: '',
  //   src2k: '',
  //   default: '',
  //   placeholder: '',
  //   overlayOpacity: 0.3,
  // },
};

/**
 * 视频地址示例：
 * 
 * 本地视频（放在 public/videos 目录下）：
 * src4k: '/videos/background-4k.mp4'
 * 
 * 在线视频：
 * src4k: 'https://example.com/videos/background-4k.mp4'
 * 
 * 相对路径（放在 src/assets/videos 目录下）：
 * import video4k from '@/assets/videos/background-4k.mp4';
 * src4k: video4k
 */
