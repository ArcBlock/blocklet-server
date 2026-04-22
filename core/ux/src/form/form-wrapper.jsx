import styled from '@emotion/styled';
import Box from '@mui/material/Box';

export default styled(Box)`
  width: 100%;
  flex-grow: 1;
  overflow-y: auto;

  ${(props) => props.theme.breakpoints.down('md')} {
    width: 100%;
    flex-shrink: 0;
    padding: 0 4px;
    transform: translate(0, 0);
    /* max-height: 60vh; */
  }

  .form-item {
    width: 100%;
    margin-bottom: 24px;
    position: relative;
    ${(props) => props.theme.breakpoints.down('md')} {
      flex-wrap: wrap;
      justify-content: space-between;
      width: 100%;
      flex-shrink: 0;
    }
  }

  .form-item-body {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .form-item-label {
    line-height: 1.2;
    font-size: 14px;
    color: #888;
    font-weight: bold;

    ${(props) => props.theme.breakpoints.down('md')} {
      text-align: left;
      width: auto;
      flex-grow: 1;
    }
  }

  .form-item-input {
    flex-grow: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    &.slot {
      height: 40px;
      line-height: 40px;
      background: ${({ theme }) => theme.palette.grey[50]};
      border: 1px solid;
      border-color: ${({ theme }) => theme.palette.background.default};
      font-size: 16px;

      &:hover {
        box-sizing: border-box;
        background: ${({ theme }) => theme.palette.background.default};
        border: 1px solid;
        border-color: ${({ theme }) => theme.palette.divider};
        border-radius: 4px;
      }

      .MuiChip-root {
        margin-top: -4px;
      }
      .placeholder {
        color: ${({ theme }) => theme.palette.grey[400]};
      }
    }

    .MuiSelect-select {
      padding: 8px;
    }
  }

  .form-item-action {
    // width: 100px;
    text-align: left;
    margin-left: 12px;
    flex-shrink: 0;
    ${(props) => props.theme.breakpoints.down('md')} {
      width: auto;
      margin-left: 0px;
    }
    .MuiIconButton-root {
      padding: 8px;
      svg {
        fill: #888;
      }
      &.Mui-disabled {
        opacity: 0.4;
      }
    }
  }
`;
