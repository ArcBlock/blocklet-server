import styled from '@emotion/styled';
import IOSSwitch from '@arcblock/ux/lib/Switch';

/**
 * 该组件的对 UX 中 iOS 风格的 Switch 组件包装, 统一布局
 * 具体参考: https://github.com/ArcBlock/blocklet-server/issues/4809
 *
 * - label 在左, 切换器在右
 * - 整体宽度控制, 宽屏下 max-width 为 300px 避免 label 与 switch 相隔太远, 窄屏下 100% 宽度
 */
/**
 * @description
 * @param {{
 *  labelProps: object,
 *  className: string;
 *  style: import('react').CSSProperties
 * } & import('@mui/material').SwitchProps} { labelProps, className, style, ...rest }
 * @return {*}
 */
function SwitchControl({ labelProps, className, style, ...rest }) {
  const _labelProps = {
    ...labelProps,
    labelPlacement: labelProps?.labelPlacement || 'start',
  };
  return (
    <Root className={className} style={style} labelPlacement={labelProps?.labelPlacement}>
      <IOSSwitch labelProps={_labelProps} {...rest} />
    </Root>
  );
}

SwitchControl.propTypes = IOSSwitch.propTypes;

const Root = styled.div`
  max-width: ${({ labelPlacement }) => (labelPlacement === 'end' ? '100%' : '300px')};
  > label {
    display: flex;
    justify-content: ${({ labelPlacement }) => (labelPlacement === 'end' ? 'flex-start' : 'space-between')};
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }
  .MuiFormControlLabel-labelPlacementEnd {
    .MuiSwitch-root {
      margin-right: 8px;
    }
  }
  ${({ theme }) => theme.breakpoints.down('sm')} {
    max-width: 100%;
  }
`;

export default SwitchControl;
