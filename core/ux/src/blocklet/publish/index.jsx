import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, useLocation, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';

import { useBlockletContext } from '../../contexts/blocklet';
import ProjectList from './project-list';
import ReleasesList from './release-list';
import CreateRelease from './create-release';

export default function BlockletPublish({ padding = '', initUrl = null }) {
  const { blocklet } = useBlockletContext();
  const location = useLocation();

  // post message to parent window when route changed
  const { componentDid } = useParams();
  useEffect(() => {
    if (componentDid && window.parent) {
      const path = `${location.pathname}${location.search}`;
      window.parent.postMessage({ event: 'popstate', page: 'publish', componentDid, path }, '*');
    }
  }, [componentDid, location]);

  if (!blocklet) {
    return null;
  }

  const style = {};
  if (padding) {
    style.padding = padding;
  }

  return (
    <Main style={style}>
      <Routes>
        <Route path="/" element={<ProjectList initUrl={initUrl} />} />
        <Route path="/:projectId" element={<ReleasesList />} />
        <Route path="/:projectId/:mode/:releaseId/:lastVersion" element={<CreateRelease initUrl={initUrl} />} />
      </Routes>
    </Main>
  );
}

BlockletPublish.propTypes = {
  padding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initUrl: PropTypes.object,
};

const Main = styled(Box)`
  a {
    color: ${({ theme }) => theme.palette.primary.main};
  }
`;
