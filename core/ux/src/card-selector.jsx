/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/alt-text */
import { useState, useEffect, useRef } from 'react';
import NFTDisplay from '@arcblock/ux/lib/NFTDisplay';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

export default function CardSelector({
  list = [],
  width = 300,
  height = 400,
  cardSpace = 40,
  onSelect = () => {},
  defaultIndex = 0,
}) {
  const [selectedId, setSelectedId] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const outerCon = useRef(null);

  // 选择卡片
  const selectedItem = (i) => {
    if (i < 0 || i > list.length - 1) {
      return;
    }
    setSelectedId(i);

    // 外部容器大小
    const outerWidth = outerCon.current.clientWidth;

    setTranslateX(i * (width + cardSpace) - (outerWidth - width) / 2 + cardSpace * 0.5);

    onSelect(i);
  };

  useEffect(() => {
    selectedItem(defaultIndex);

    const func = (e) => e.preventDefault();
    outerCon.current.addEventListener('touchmove', func, { passive: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let startX;

  const touchstart = (e) => {
    const point = e.touches[0];
    startX = point.clientX;
  };

  const touchend = (e) => {
    const point = e.changedTouches[0];
    const diffX = startX - point.clientX;

    if (Math.abs(diffX) > 60) {
      if (diffX > 0) {
        selectedItem(selectedId + 1);
      } else {
        selectedItem(selectedId - 1);
      }
    }
  };

  return (
    <Container ref={outerCon} onTouchStart={touchstart} onTouchEnd={touchend}>
      <div className="card-container" style={{ transform: `translate(${-translateX}px, 0)` }}>
        {list.map((x, i) => {
          return (
            <div
              key={x.id}
              className={`card-item ${i === selectedId ? 'selected' : ''}`}
              style={{ width, height, margin: cardSpace / 2 }}
              onClick={() => selectedItem(i)}>
              {x.display ? (
                <div className="card-content">
                  <NFTDisplay data={x.display} style={{ width: '100%', height: '100%' }} />
                </div>
              ) : (
                <div className="card-content" dangerouslySetInnerHTML={{ __html: x.src }} />
              )}
            </div>
          );
        })}
      </div>
    </Container>
  );
}

const Container = styled.div`
  overflow: hidden;
  mask-image: linear-gradient(to left, transparent, black 3%, black 97%, transparent);
  overflow: hidden;
  .card-container {
    display: flex;
    white-space: nowrap;
    width: max-content;
    transition: all ease 0.3s;
  }
  .card-item {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    cursor: pointer;

    .card-content {
      pointer-events: none;
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      outline: #526ded solid 0;
      transition: all ease 0.2s;
      box-shadow: rgba(0, 0, 0, 0.2) 0 0 10px;
    }
    &.selected {
      cursor: default;
      .card-content {
        outline: #526ded solid 5px;
      }
    }
  }
`;

CardSelector.propTypes = {
  list: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number,
  cardSpace: PropTypes.number,
  onSelect: PropTypes.func,
  defaultIndex: PropTypes.number,
};
