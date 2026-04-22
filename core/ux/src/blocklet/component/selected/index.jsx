/* eslint-disable react/jsx-one-expression-per-line */
import { Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { bool, node } from 'prop-types';
import styled from '@emotion/styled';

/**
 *
 *
 * @export
 * @param {{
 *  children: React.ReactNode,
 *  selected?: false | true,
 * }} { children, selected }
 * @return {React.Component}
 */
export default function Selected({ children, selected = false }) {
  return (
    <BoxContainer>
      {children}
      <Box className={`selected-container ${selected ? 'selected' : ''}`}>
        {/* check icon */}
        <CheckIcon className="selected-icon" />
      </Box>
    </BoxContainer>
  );
}

const BoxContainer = styled(Box)`
  position: relative;

  .selected-container {
    display: flex !important;
    position: absolute;
    right: 0px;
    bottom: 0px;
    -webkit-box-pack: end;
    justify-content: flex-end;
    align-items: flex-end;
    width: 32px;
    height: 32px;
    border-radius: 0px 0px 8px;
    color: rgb(255, 255, 255);
    overflow: hidden;
    transition: all 0.4s ease 0s;

    &::after {
      position: absolute;
      z-index: 0;
      left: 60px;
      top: 60px;
      display: block;
      width: 0px;
      height: 0px;
      border-width: 16px;
      border-style: solid;
      border-color: transparent #1dc1c7 #1dc1c7 transparent;
      transition: all 0.1s ease 0s;
      content: '';
    }

    .selected-icon {
      visibility: hidden;
      width: 60%;
      height: 60%;
      position: relative;
      z-index: 2;
      margin: 0px 1px 1px 0px;
      font-size: 16px;
      transition: all 0.2s ease 0s;
    }
  }

  .selected-container.selected {
    &::after {
      left: 0px;
      top: 0px;
    }

    .selected-icon {
      visibility: visible;
    }
  }
`;

Selected.propTypes = {
  children: node.isRequired,
  selected: bool,
};
