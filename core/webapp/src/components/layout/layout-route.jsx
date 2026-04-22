import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import DashboardLayout from './index';

/**
 * 包装 Route & DashboardLayout, 避免在每次路由切换时 unmount/mount DashboardLayout (导致 sidebar 图标也跟着 unmount/mount - 闪烁问题)
 */
export default function DashboardRoute({ title = 'Blocklet Server', scrollable = true, fullWidth = false, children }) {
  return (
    <StyledDashboardLayout scrollable={scrollable} fullWidth={fullWidth} title={title}>
      {children}
    </StyledDashboardLayout>
  );
}

DashboardRoute.propTypes = {
  children: PropTypes.any.isRequired,
  title: PropTypes.string,
  // layout 是否可滚动, ux/dashboard 默认行为是可滚动, 某些页面 (比如 console, logger) 的布局, 更像 app-styled layout,
  // 对此可以将 scrollable 设置为 false, content 自行控制滚动
  scrollable: PropTypes.bool,
  fullWidth: PropTypes.bool,
};

const StyledDashboardLayout = styled(DashboardLayout)`
  .dashboard-content {
    padding-top: 16px;
    ${props => (props.scrollable ? '' : 'overflow: hidden')};
  }
`;
