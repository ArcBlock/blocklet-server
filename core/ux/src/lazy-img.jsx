import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function LazyImg({ src, alt = '', ...rest }) {
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // 如果浏览器不支持 IntersectionObserver，则直接加载图片
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return () => {};
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect(); // 加载后断开观察
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return <img ref={imgRef} src={isInView ? src : undefined} alt={alt} {...rest} />;
}

LazyImg.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
};

export default LazyImg;
