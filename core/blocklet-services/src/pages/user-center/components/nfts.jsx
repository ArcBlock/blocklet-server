import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Pagination, Skeleton, Typography, IconButton, Stack, alpha } from '@mui/material';
import { useCreation, useMemoizedFn, useReactive, useRequest } from 'ahooks';
import axios from 'axios';
import { Icon } from '@iconify/react';
import NFTDisplay, { getNFTData } from '@arcblock/ux/lib/NFTDisplay';
import Empty from '@arcblock/ux/lib/Empty';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { joinURL } from 'ufo';
import SocialShare from '@arcblock/ux/lib/SocialShare';
import NftPreview from '@arcblock/ux/lib/NFTDisplay/preview';

import useMobile from '../../../hook/use-mobile';

const maskStyle = (theme) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  opacity: 0,
  transition: 'opacity 0.3s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
  '& .mask-item': {
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    color: 'text.primary',
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 1),
    },
  },
});

const footerMaskStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 24,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  gap: 1,
  zIndex: 1,
  '& .mask-item': {
    width: 20,
    height: 20,
    color: 'white',
  },
};

const CHAIN_EXPLORER_URL = 'https://main.abtnetwork.io/explorer';

function Nft({ user }) {
  const { t, locale } = useLocaleContext();
  const isMobile = useMobile();
  const [previewProps, setPreviewProps] = useState({
    visible: false,
    nft: null,
  });

  const [shareProps, setShareProps] = useState({
    anchorEl: null,
    props: null,
  });

  const handleLinkClick = (nftAddress) => {
    const targetURL = joinURL(CHAIN_EXPLORER_URL, 'assets', nftAddress);
    window.open(targetURL, '_blank');
  };

  const handleShareClick = (element, nft) => {
    let domain = '';
    if (typeof nft.data?.value === 'string') {
      domain = JSON.parse(nft.data?.value)?.domain;
    } else {
      domain = nft.data?.value?.domain;
    }
    setShareProps({
      anchorEl: element,
      props: {
        title: domain ? `Hey, I just won an NFT at the ${domain} event!` : 'Hey, I just won an NFT!',
        url: joinURL(CHAIN_EXPLORER_URL, 'assets', nft.address),
      },
    });
  };

  const handleViewClick = (nft) => {
    setPreviewProps({
      visible: true,
      nft,
    });
  };

  const paging = useReactive({
    page: 1,
    size: 20,
  });
  const userState = useRequest(
    async (pagination = paging) => {
      const response = await axios.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/ocap/listAssets`, {
        params: {
          ownerAddress: user.did, // 'z1VV21NqNWkiadznN32ALkos5dQqQwnCMty',
          ...pagination,
        },
      });
      return response.data;
    },
    {
      ready: user?.did && paging,
      defaultParams: [paging],
      refreshDeps: [user?.did, paging],
    }
  );

  const { loading, data } = userState;

  const dataPage = data?.page ?? { cursor: 0, next: false, total: 0 };

  const handlePageChange = (event, value) => {
    paging.page = value;
    userState.run(paging);
  };

  const actions = useMemoizedFn((item) => {
    return [
      <IconButton
        key="link"
        size="small"
        className="mask-item"
        onClick={(e) => {
          e.stopPropagation();
          handleLinkClick(item.address);
        }}>
        <Icon icon="tabler:link" fontSize={18} />
      </IconButton>,
      <IconButton
        key="share"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleShareClick(e.currentTarget, item);
        }}
        className="mask-item">
        <Icon icon="tabler:share-2" fontSize={18} />
      </IconButton>,
      <IconButton
        key="view"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleViewClick(item);
        }}
        className="mask-item">
        <Icon icon="tabler:eye" fontSize={18} />
      </IconButton>,
    ];
  });

  const content = useCreation(() => {
    if (loading) {
      const skeletonItems = ['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4', 'skeleton-5'].map((id) => (
        <Skeleton key={id} variant="rectangular" width="15%" height={166} sx={{ borderRadius: 1, flexShrink: 0 }} />
      ));

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
          <Skeleton width="20%" />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 2,
              flexWrap: 'nowrap',
            }}>
            {skeletonItems}
          </Box>
        </Box>
      );
    }
    return (
      <>
        <Typography
          sx={{
            color: 'grey.A700',
            fontWeight: 600,
            mb: 2.5,
          }}>
          {t('userCenter.common.nft')}
        </Typography>

        {data?.assets?.length === 0 && !loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            <Empty>{t('userCenter.common.noNFT')}</Empty>
          </Box>
        )}
        <Box
          className="nft-list-wrapper"
          sx={{
            display: 'grid',
            justifyItems: 'start',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(5, 1fr)',
            },
            gap: 2.5,
          }}>
          {data?.assets?.map((item) => (
            <Box
              key={item.address}
              sx={{
                flexShrink: 0,
                width: { xs: 120, sm: 120, md: 120, lg: 166 },
                height: { xs: 120, sm: 120, md: 120, lg: 166 },
                position: 'relative',
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                ...(!isMobile ? { '&:hover .mask': { opacity: 1 } } : {}),
              }}>
              <NFTDisplay
                data={getNFTData(item)}
                address={item.address}
                inset
                imageFilter={{
                  imageFilter: 'resize',
                  w: '500',
                  f: 'webp',
                }}
              />
              {isMobile ? (
                <Box className="footer-mask" sx={footerMaskStyle}>
                  {actions(item)}
                </Box>
              ) : (
                <Box className="mask" sx={maskStyle}>
                  <Stack direction="row" spacing={1}>
                    {actions(item)}
                  </Stack>
                </Box>
              )}
            </Box>
          ))}
        </Box>
        {dataPage.next || paging.page > 1 ? (
          <Pagination
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 2,
            }}
            page={paging.page}
            onChange={handlePageChange}
            count={Math.ceil(dataPage.total / paging.size)}
            size="small"
          />
        ) : null}

        <NftPreview
          visible={previewProps.visible && !!previewProps.nft}
          nft={previewProps.nft}
          onClose={() => {
            setPreviewProps({ visible: false, nft: null });
          }}
        />

        <SocialShare
          locale={locale}
          anchorEl={shareProps.anchorEl}
          onClose={() => {
            setShareProps({ anchorEl: null, props: null });
          }}
          sharedProps={shareProps.props || { title: '', url: '' }}
        />
      </>
    );
  }, [loading, dataPage, paging.page, paging.size, handlePageChange, shareProps, previewProps]);

  return <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, mb: 5 }}>{content}</Box>;
}

Nft.propTypes = {
  user: PropTypes.object.isRequired,
};

export default Nft;
