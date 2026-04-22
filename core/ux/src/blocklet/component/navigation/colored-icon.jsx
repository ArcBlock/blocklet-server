/* eslint-disable no-bitwise */
/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Box } from '@mui/material';

const parseColor = (colorStr) => {
  // 支持 #RGB 和 #RRGGBB 格式
  const hex = colorStr.replace('#', '');
  if (!/^([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    return { r: 0, g: 0, b: 0 };
  }
  const normalize =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  return {
    r: parseInt(normalize.substr(0, 2), 16),
    g: parseInt(normalize.substr(2, 2), 16),
    b: parseInt(normalize.substr(4, 2), 16),
  };
};

export default function ColoredIcon({ src, color, size = 24, ...props }) {
  const [coloredImageUrl, setColoredImageUrl] = useState('');

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 处理跨域问题

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // 绘制原图
      ctx.drawImage(img, 0, 0);

      // 获取像素数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      // 解析目标颜色
      const targetRGB = parseColor(color);

      // 处理每个像素
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          // 只处理非透明像素
          const alpha = data[i + 3] / 255;
          data[i] = targetRGB.r * alpha; // R
          data[i + 1] = targetRGB.g * alpha; // G
          data[i + 2] = targetRGB.b * alpha; // B
        }
      }

      // 将处理后的像素数据放回 canvas
      ctx.putImageData(imageData, 0, 0);

      // 转换为 base64 URL
      setColoredImageUrl(canvas.toDataURL('image/png'));
    };

    img.src = src;

    return () => {
      img.onload = null;
    };
  }, [src, color]);

  return (
    <Box
      component="img"
      src={coloredImageUrl || src} // 在处理完成前显示原图
      sx={{
        width: size,
        height: size,
        display: 'block',
        opacity: coloredImageUrl ? 1 : 0.5, // 在处理完成前降低透明度
        transition: 'opacity 0.2s',
      }}
      {...props}
    />
  );
}
