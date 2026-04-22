import styled from '@emotion/styled';

const DialogStyle = styled.div`
  width: 632px;
  height: 90vh;
  overflow: auto;
  @media (max-width: ${(props) => props.theme.breakpoints.values.md - 1}px) {
    width: 100%;
    height: 100%;
  }
  display: flex;
  flex-direction: column;

  .dialog-header {
    flex-shrink: 0;
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 30;
    flex: 0;
    box-sizing: border-box;
    width: 100%;
    padding: 0 12px;
    min-height: 72px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f8f8f8;
    .title {
      color: #222;
      font-size: 16px;
    }
    .left,
    .right {
      flex-shrink: 0;
      flex-basis: auto;
      width: 120px;
    }
    .right {
      text-align: right;
      svg {
        fill: #bfbfbf;
      }
    }
  }
  .dialog-content {
    flex-grow: 1;
    padding: 16px 24px;
  }
  .dialog-actions {
    flex-shrink: 0;
    border-top: 1px solid #f8f8f8;
    padding 24px;
    position: sticky;
    bottom: 0;
    z-index: 20;
    background: #fff;
    display: flex;
    justify-content: flex-end;
    .MuiButton-root {
      padding-left: 3em;
      padding-right: 3em;
    }
  }
  .dialog-h1 {
    font-style: normal;
    font-weight: 400;
    font-size: 24px;
    line-height: 28px;
    color: #222222;
  }
`;

export default DialogStyle;
