import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Iframe from 'react-iframe';
import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import { useNodeContext } from '../../contexts/node';

export default function BlockletPreference({ id, ...rest }) {
  const { info, inService } = useNodeContext();

  const pathPrefix = useMemo(() => {
    if (inService) {
      return WELLKNOWN_SERVICE_PATH_PREFIX;
    }
    return process.env.NODE_ENV === 'production' ? info?.routing?.adminPath : '';
  }, [inService, info?.routing?.adminPath]);

  const search = useMemo(() => {
    const urlSearchParams = new URLSearchParams();
    if (!inService) {
      urlSearchParams.set('authKey', '__sst');
    }

    urlSearchParams.set(
      'schemaKey',
      joinURL(window.location.origin, pathPrefix, `/api/preferences?id=${encodeURIComponent(id)}`)
    );

    return urlSearchParams.toString();
  }, [inService, pathPrefix, id]);

  return (
    <Iframe
      url={`${joinURL(window.location.origin, pathPrefix, '/hosted/form-collector/')}?${search}`}
      width="100%"
      height="100%"
      frameBorder={0}
      styles={{ border: 0 }}
      onLoad={(e) => {
        const { contentDocument } = e.target;
        try {
          if (contentDocument) {
            const body = contentDocument.querySelector('body');
            if (body) {
              const style = document.createElement('style');
              style.textContent = `
                .ant-formily-layout {
                  padding: 0 !important;
                  position: relative !important;
                  min-height: 100% !important;
                }
  
                .form-actions {
                  position: fixed !important;
                  bottom: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  background: white !important;
                  padding: 0 !important;
                  padding-top: 16px !important;
                  margin: 0 !important;
                  z-index: 100 !important;
                  display: flex !important;
                  justify-content: flex-end !important;
                  margin-right: 8px !important;
                }
  
                form {
                  overflow: hidden !important;
                }
  
                form > *:nth-last-child(2) {
                  margin-bottom: 64px !important;
                }
              `;
              body.appendChild(style);
            }
          }
        } catch (error) {
          console.error(error);
        }
      }}
      {...rest}
    />
  );
}

BlockletPreference.propTypes = {
  id: PropTypes.string.isRequired,
};
