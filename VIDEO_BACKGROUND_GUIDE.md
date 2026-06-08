# 视频背景使用指南

## 快速开始

### 1. 准备视频文件

将您的视频文件放置在以下任一位置：

**方式一：public目录（推荐）**
```
public/
  └── videos/
      ├── background-8k.mp4
      ├── background-4k.mp4
      └── background-2k.mp4
```

**方式二：使用在线视频地址**
确保视频URL支持CORS访问

### 2. 配置视频地址

打开 `src/config/videoConfig.ts` 文件，填写视频地址：

```typescript
export const videoBackgroundConfig = {
  login: {
    // 本地视频示例
    src8k: '/videos/background-8k.mp4',
    src4k: '/videos/background-4k.mp4',
    src2k: '/videos/background-2k.mp4',
    default: '/videos/background-4k.mp4',
    
    // 或使用在线视频
    // src4k: 'https://example.com/videos/background-4k.mp4',
    
    // 占位图（可选）
    placeholder: '/images/placeholder.jpg',
    
    // 遮罩层透明度（0-1）
    overlayOpacity: 0.3,
  },
};
```

## 功能特性

### 智能视频选择

组件会根据以下条件自动选择最合适的视频源：

1. **设备性能检测**：检测CPU核心数判断设备性能
2. **网络状况检测**：检测网络类型（4G/3G/WiFi等）
3. **自动降级**：如果高分辨率视频加载失败，自动降级到默认视频

### 性能优化

- ✅ 视频预加载
- ✅ 按需加载不同分辨率
- ✅ 加载失败自动降级
- ✅ 占位图显示
- ✅ 平滑过渡动画

## 视频格式建议

### 编码格式
- **容器格式**：MP4
- **视频编码**：H.264 (AVC) 或 H.265 (HEVC)
- **音频编码**：AAC（建议静音）

### 分辨率建议
- **8K**：7680x4320 或更高
- **4K**：3840x2160
- **2K**：2560x1440
- **默认**：建议使用 2K 或 4K

### 文件大小建议
- 8K：< 50MB
- 4K：< 30MB
- 2K：< 15MB

### 压缩工具推荐
- [HandBrake](https://handbrake.fr/) - 开源视频压缩工具
- [FFmpeg](https://ffmpeg.org/) - 命令行工具

**FFmpeg压缩示例：**
```bash
# 压缩为4K视频
ffmpeg -i input.mp4 -vf scale=3840:2160 -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k output-4k.mp4

# 压缩为2K视频
ffmpeg -i input.mp4 -vf scale=2560:1440 -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k output-2k.mp4
```

## 自定义配置

### 修改遮罩层透明度

在 `videoConfig.ts` 中调整 `overlayOpacity` 值：
- `0`：完全透明
- `0.3`：轻微遮罩（默认）
- `0.5`：中等遮罩
- `1`：完全遮罩

### 在其他页面使用

```tsx
import VideoBackground from '../components/VideoBackground';

<VideoBackground
  videoSrc={{
    src8k: '您的8K视频地址',
    src4k: '您的4K视频地址',
    src2k: '您的2K视频地址',
    default: '您的默认视频地址',
  }}
  overlayOpacity={0.3}
>
  {/* 页面内容 */}
</VideoBackground>
```

## 常见问题

### Q: 视频不播放？
A: 检查以下几点：
1. 视频地址是否正确
2. 视频格式是否为MP4
3. 浏览器是否支持视频标签
4. 是否有CORS限制（在线视频）

### Q: 视频加载慢？
A: 建议：
1. 压缩视频文件大小
2. 使用CDN加速
3. 提供占位图
4. 降低默认视频分辨率

### Q: 如何静音播放？
A: 组件默认静音播放（`muted={true}`），这是浏览器的最佳实践，可以确保视频自动播放。

### Q: 移动端性能问题？
A: 组件会自动检测设备性能并选择合适的视频源，建议：
1. 为移动端提供2K或更低分辨率的视频
2. 优化视频文件大小
3. 使用占位图提升用户体验

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ iOS Safari 11+
- ✅ Android Chrome 60+

## 技术支持

如有问题，请检查：
1. 浏览器控制台错误信息
2. 网络请求是否成功
3. 视频文件是否可访问
