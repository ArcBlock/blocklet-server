import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import Fab from '@mui/material/Fab';
import throttle from 'lodash/throttle';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Zoom from '@mui/material/Zoom';

const ScrollButton = styled(Fab)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  @media (max-width: 600px) {
    bottom: 16px;
    right: 16px;
    transform: scale(0.9);
  }
`;

function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // 监听滚动事件，决定是否显示按钮
  useEffect(() => {
    const toggleVisibility = throttle(() => {
      // 当滚动距离超过300px时显示按钮
      setIsVisible(window.pageYOffset > 300);
    }, 200);

    window.addEventListener('scroll', toggleVisibility);

    // 初始化时检查一次
    toggleVisibility();

    // 清除监听器
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // 滚动到顶部的函数
  const scrollToTop = () => {
    try {
      if ('scrollTo' in window) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      } else {
        // 降级处理
        window.scrollTo(0, 0);
      }
    } catch (error) {
      // 降级处理
      window.scrollTo(0, 0);
    }
  };

  return (
    <Zoom in={isVisible}>
      <ScrollButton color="primary" size="small" aria-label="scroll back to top" onClick={scrollToTop}>
        <KeyboardArrowUpIcon />
      </ScrollButton>
    </Zoom>
  );
}

export default ScrollToTop;
