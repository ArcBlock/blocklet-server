import styled from '@emotion/styled';

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;

  .right {
    display: flex;
    align-items: center;
  }

  .tabs {
    .MuiButton-root {
      border: none;
      color: #999;
      &.active {
        color: #222;
      }
    }
  }

  @media (max-width: 600px) {
    display: block;
    .right {
      margin-top: 12px;
    }
  }
`;

export default ListHeader;
