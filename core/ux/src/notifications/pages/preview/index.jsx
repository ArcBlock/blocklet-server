import { Fragment } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import isEmpty from 'lodash/isEmpty';
import { Card, Box } from '@mui/material';
import colors from '@arcblock/ux/lib/Colors/themes/temp';
import useMediaQuery from '@mui/material/useMediaQuery';
import AttachmentPreviewPage from './attachment';
import DataPreviewPage from './data';
import { getSeverityColor, isAllText, combinedItem, isAllImage, isSameTypes } from './utils';
import CombinedPreviewPage from './attachment/combined';

/**
 * notification preview page, preview 内容有 attachments 和 data 两种情况
 */
function NotificationPreview({ notification, severity, showSke = true }) {
  const { attachments, data, ...rest } = notification;
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'));

  if ((!attachments || !attachments.length) && isEmpty(data)) {
    return null;
  }

  const severityColor = getSeverityColor(severity);

  const renderAttachment = (items, inSection = false) => {
    if (!items && !Array.isArray(items)) {
      return null;
    }
    let renderItems = items;
    let style = {};
    let orientation = 'horizontal';
    if (inSection && isAllText(items)) {
      renderItems = combinedItem(items);
      orientation = 'vertical';
      style = {
        display: 'flex',
        gap: 8,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        height: '100%',
        width: isMd || renderItems.length === 1 ? '100%' : '28%',
      };
    }
    const showDivider = isSameTypes(renderItems);

    return (
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          gap: 1,
          flexDirection: inSection ? 'row' : 'column',
          justifyContent: 'flex-start',
          alignItems: inSection ? 'center' : 'unset',
          flexWrap: 'wrap',
        }}>
        {renderItems.map((attachment, index) => {
          if (attachment.type === 'section') {
            // eslint-disable-next-line react/no-array-index-key
            return <CombinedPreviewPage key={index} data={attachment.fields} />;
          }
          return (
            // eslint-disable-next-line react/no-array-index-key
            <Fragment key={index}>
              <AttachmentPreviewPage attachment={attachment} style={style} {...rest} />
              {!(isMd && orientation === 'vertical') &&
              showDivider &&
              renderItems.length > 1 &&
              index !== renderItems.length - 1 ? (
                <Divider
                  orientation={orientation}
                  style={{ color: colors.dividerColor }}
                  sx={orientation === 'vertical' ? { ml: 2, mr: 2, height: 32 } : {}}
                />
              ) : null}
            </Fragment>
          );
        })}
      </Box>
    );
  };

  const isAllImages = isAllImage(attachments);

  return (
    <Container>
      <div className="message-in-list">
        {attachments.length > 0 && (
          <div className="message-container" style={isMd ? { width: '100%' } : {}}>
            {isAllImages ? (
              renderAttachment(attachments)
            ) : (
              <Card
                variant="outlined"
                className="attachment-card"
                sx={{ px: isMd ? 1 : 2, py: 1.5, borderRadius: '8px', minWidth: 128, borderColor: severityColor }}>
                {renderAttachment(attachments)}
              </Card>
            )}
          </div>
        )}
        {!isEmpty(data) && (
          <div className="message-container">
            <div className="data-container">
              <DataPreviewPage data={data} feedType={notification.feedType} />
            </div>
          </div>
        )}
        {attachments.length === 0 && isEmpty(data) && showSke && (
          <Skeleton className="attach-ske" style={{ marginTop: 10 }} variant="rectangular" height={150} />
        )}
      </div>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  .message-in-list {
    padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(1.5)} ${theme.spacing(1.5)} 0`};
    display: flex;
    border-radius: 8px;
  }
  .message-title {
    color: #25292f;
    font-size: 18px;
    font-weight: bold;
    word-break: break-all;
  }

  .attach-ske {
    position: relative;
    margin-left: 10px;
    &::after {
      content: '';
      position: absolute;
      left: -10px;
      top: 0;
      height: 100%;
      width: 4px;
      background-color: ${(props) => props.leftLineColor};
    }
  }

  .message-body {
    color: #25292f;
    font-size: 16px;
    word-break: break-all;
    white-space: pre-line;
  }
  .message-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    .data-container,
    .attachment-container {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
  }
  .actions-container {
    margin-top: 10px;
    .actions-item {
      margin-right: 8px;
    }
  }
`;

NotificationPreview.propTypes = {
  severity: PropTypes.string.isRequired,
  notification: PropTypes.object.isRequired,
  showSke: PropTypes.bool,
};

export default NotificationPreview;
