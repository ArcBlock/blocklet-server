/* eslint-disable react/no-unstable-nested-components */
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { joinURL } from 'ufo';
import upperFirst from 'lodash/upperFirst';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, useMediaQuery, IconButton, Typography, Tooltip, Breadcrumbs, Dialog } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Datatable, { getDurableData } from '@arcblock/ux/lib/Datatable';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import Button from '@arcblock/ux/lib/Button';
import Toast from '@arcblock/ux/lib/Toast';
import Tag from '@arcblock/ux/lib/Tag';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';

import { PROJECT } from '@blocklet/constant';
import InstallDesktopIcon from '@mui/icons-material/InstallDesktop';
import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';
import EmptySpinner from '../../empty-spinner';
import Confirm from '../../confirm';
import BlockletCard from './blocklet-card';
import ShortenLabel from '../component/shorten-label';
import ClickToCopy from '../../click-to-copy';
import parseJsonText from '../../util/parse-json-text';
import ListHeader from '../../list-header';

export default function ReleaseList() {
  const { t, locale } = useLocaleContext();
  const { projectId } = useParams();
  const { api } = useNodeContext();
  const [loading, setLoading] = useState(true);
  const { blocklet } = useBlockletContext();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const [releases, setReleases] = useState(null);
  const [project, setProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const serverEndpoint = window.env?.serverEndpoint;

  const durableKey = `releases-${blocklet.meta.did}-${projectId}`;
  const tableDurableData = getDurableData(durableKey);

  const [search, setSearch] = useState({
    searchText: tableDurableData.searchText || '',
    pageSize: tableDurableData.rowsPerPage || 10,
    page: 1,
  });

  const getReleases = () => {
    api
      .getReleases({ input: { did: blocklet.meta.did, projectId } })
      .then((res) => {
        const list = res?.releases || [];
        setLoading(false);
        setReleases(list);
      })
      .catch((err) => {
        setLoading(false);
        Toast.error(err.message);
      });
  };

  const getData = () => {
    api
      .doBatchQuery({
        getProject: { input: { did: blocklet.meta.did, projectId } },
        getReleases: { input: { did: blocklet.meta.did, projectId } },
      })
      .then((res) => {
        setProject(res.getProject.project || {});
        setReleases(res.getReleases.releases || []);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        Toast.error(err.message);
      });
  };

  useEffect(() => {
    getData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [installResourceTip, setInstallResourceTip] = useState('');

  const deleteRelease = () => {
    setLoading(false);
    const releaseId = deleteConfirm.id;
    api
      .deleteRelease({ input: { did: blocklet.meta.did, projectId, releaseId } })
      .then(() => {
        setLoading(false);
        getReleases();
        Toast.success(t('common.removeSuccess'));
        setDeleteConfirm(null);
      })
      .catch((err) => {
        setLoading(false);
        Toast.error(err.message);
      });
  };

  const onDeleteRelease = (release) => {
    setDeleteConfirm(release);
  };

  if (!releases && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '40px' }}>
        <EmptySpinner />
      </Box>
    );
  }

  if (!releases) {
    return null;
  }

  const breadcrumbs = (
    <Breadcrumbs className="breadcrumbs" aria-label="breadcrumb">
      <Link to="..">{t('common.blockletStudio')}</Link>
      <Typography
        sx={{
          color: 'text.primary',
        }}>
        <ShortenLabel maxLength={isMobile ? 6 : 30}>{project.blockletTitle}</ShortenLabel>
      </Typography>
    </Breadcrumbs>
  );

  if (!releases.length) {
    return (
      <>
        {breadcrumbs}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 10,
          }}>
          <Box sx={{ fontSize: 20, fontWeight: 'bold', mb: 3 }}>{t('blocklet.publish.releaseEmptyTip')}</Box>
          <Box sx={{ fontSize: 14, color: 'text.secondary', mb: 3 }}>{t('blocklet.publish.createReleaseTip')}</Box>
          <Link to="create/none">
            <Button variant="contained">{t('blocklet.publish.createRelease')}</Button>
          </Link>
        </Box>
      </>
    );
  }

  const columns = [
    {
      label: t('common.version'),
      name: 'blockletVersion',
      minWidth: 160,
      options: {
        customBodyRenderLite: (rawIndex) => {
          const release = releases[rawIndex];
          return (
            <Link to={`view/${release.id}/${release.blockletVersion}`}>
              <BlockletCard
                did={blocklet.meta.did}
                projectId={project.id}
                logo={release.blockletLogo}
                title={release.blockletVersion}
                describe={release.blockletTitle}
              />
            </Link>
          );
        },
      },
    },
    {
      label: t('blocklet.publish.releaseNote'),
      name: 'note',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const release = releases[rawIndex];
          return <Typography className="note">{parseJsonText(release.note, 'note')}</Typography>;
        },
      },
    },
    {
      label: t('common.status'),
      name: 'status',
      options: {
        customBodyRender: (value) => {
          return (
            <Tag type={value === 'published' ? 'success' : 'warning'}>
              {value === 'published' ? 'Released' : upperFirst(value)}
            </Tag>
          );
        },
      },
    },
    {
      label: t('common.lastPublishedAt'),
      name: 'updatedAt',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const release = releases[rawIndex];
          if (release.status !== PROJECT.RELEASE_STATUS.published) {
            return '';
          }
          return <RelativeTime value={Number(release.updatedAt)} locale={locale} />;
        },
      },
    },
    {
      label: t('common.actions'),
      name: 'actions',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const release = releases[rawIndex];
          let installUrl = '';
          let downloadUrl = '';
          const published = release.status === 'published';

          if (published) {
            const blockletMetaUrl = joinURL(
              serverEndpoint,
              `/api/project/${blocklet.meta.did}/${project.id}/${project.lastReleaseId}/release/blocklet.json`
            );
            const url = new URL(serverEndpoint);
            url.pathname = joinURL(url.pathname, '/launch-blocklet/agreement');
            url.searchParams.set('blocklet_meta_url', blockletMetaUrl);
            installUrl = url.href;

            downloadUrl = joinURL(
              `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/project/${blocklet.meta.did}/${project.id}/${
                release.id
              }/download/${(release.files || [])[0]}`
            );
          }

          const projectType =
            project.blockletComponents?.some((x) => x.included) || release.uploadedResource ? 'pack' : 'resource';

          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}>
              {published && projectType === 'pack' && (
                <Tooltip title={t('blocklet.publish.install', { name: project.blockletTitle })} placement="top">
                  <IconButton color="secondary" aria-label="create">
                    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                    <a style={{ display: 'flex' }} href={installUrl} target="_blank" rel="noreferrer">
                      <InstallDesktopIcon sx={{ fontSize: 18 }} />
                    </a>
                  </IconButton>
                </Tooltip>
              )}
              {published && (
                <Tooltip title={t('blocklet.publish.download', { name: project.blockletTitle })} placement="top">
                  <IconButton color="primary" aria-label="download">
                    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                    <a style={{ display: 'flex' }} href={downloadUrl}>
                      <DownloadIcon sx={{ fontSize: 18 }} />
                    </a>
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={t('blocklet.publish.delete', { name: project.blockletTitle })} placement="top">
                <IconButton color="primary" aria-label="delete" onClick={() => onDeleteRelease(release)}>
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    },
  ];

  const onTableChange = ({ page, rowsPerPage, searchText }) => {
    if (search.pageSize !== rowsPerPage) {
      setSearch((x) => ({ ...x, searchText: '', pageSize: rowsPerPage, page: 1 }));
    } else if (search.page !== page + 1) {
      setSearch((x) => ({ ...x, searchText: '', page: page + 1 }));
    } else if (search.searchText !== searchText) {
      setSearch((x) => ({ ...x, searchText, page: 1 }));
    }
  };

  const lastReleaseVersion = releases?.[0]?.blockletVersion || '0.0.0';

  return (
    <Main>
      <ListHeader
        sx={{ mb: 2 }}
        left={breadcrumbs}
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => {
                const latestVersionMetaUrl = joinURL(
                  serverEndpoint,
                  `/api/project/${blocklet.meta.did}/${projectId}/blocklet.json`
                );
                setInstallResourceTip(latestVersionMetaUrl);
              }}>
              {t('blocklet.publish.copyInstallUrl')}
            </Button>
            <Link to={`new-release/none/${lastReleaseVersion}`}>
              <Button variant="contained">
                <AddIcon style={{ fontSize: '1.3em', marginRight: 4 }} />
                {t('blocklet.publish.createRelease')}
              </Button>
            </Link>
          </>
        }
      />

      <Dialog fullWidth maxWidth="sm" open={installResourceTip} onClose={() => setInstallResourceTip('')}>
        <Box sx={{ py: 5, px: 4, wordBreak: 'break-all' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('blocklet.publish.installResourceTip')}
          </Typography>
          <ClickToCopy>{installResourceTip}</ClickToCopy>
          <Typography sx={{ mt: 2 }}>
            {t('blocklet.publish.installResourceTip2')}
            <a
              style={{ marginLeft: 4 }}
              href="https://www.arcblock.io/docs/blocklet-developer/how-to-use-install-url"
              target="_blank"
              rel="noreferrer">
              {t('blocklet.publish.installResourceHelp')}
            </a>
          </Typography>
        </Box>
      </Dialog>
      <Datatable
        className="main-table"
        verticalKeyWidth={100}
        locale={locale}
        data={releases}
        columns={columns}
        durable={durableKey}
        options={{
          sort: false,
          download: false,
          filter: false,
          print: false,
          search: false,
        }}
        onChange={onTableChange}
      />
      {deleteConfirm && (
        <Confirm
          title={t(`${t('common.delete')} ${deleteConfirm.blockletVersion}`)}
          description={t('blocklet.publish.deleteReleaseTip')}
          confirm={t('common.confirm')}
          onConfirm={deleteRelease}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </Main>
  );
}

const Main = styled(Box)`
  .main-table > div:first-child {
    display: none;
  }
  .note {
    word-break: break-all;
    white-space: pre-line;
  }
  ${({ theme }) => theme.breakpoints.down('md')} {
    .MuiTableRow-root {
      border-color: ${({ theme }) => theme.palette.divider};
    }
  }
`;
