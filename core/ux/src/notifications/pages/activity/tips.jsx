import { Box, Typography, Button, Paper } from '@mui/material';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import ArrowUpRightFilledIcon from '@iconify-icons/tabler/arrow-up-right';

TipsActivity.propTypes = {
  meta: PropTypes.object.isRequired,
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  maxWidth: 320,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  marginTop: theme.spacing(1),
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
}));

const LogoWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const ContentWrapper = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export default function TipsActivity({ meta }) {
  const { amount, symbol, chainId } = meta;

  const viewOnExplorer = () => {
    window.open(`https://explorer.arcblock.io/chain/${chainId}`, '_blank');
  };

  return (
    <StyledPaper>
      <LogoWrapper>
        <img
          alt="ArcBlock Beta"
          src="https://bbqat7g5cg33cyr4pdrd6foycgzfb5xxeh2se7gcqkq.did.abtnet.io/payment-kit/methods/arcblock.png"
          width={32}
          height={32}
          style={{ borderRadius: 16 }}
        />
        <Typography
          variant="h5"
          sx={{
            color: 'text.primary',
          }}>
          ArcBlock
        </Typography>
      </LogoWrapper>
      <ContentWrapper>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 1,
          }}>
          <Typography
            component="span"
            variant="h5"
            sx={{
              color: 'text.primary',
              fontWeight: 'bold',
            }}>
            + {amount}
          </Typography>
          <Typography
            component="span"
            variant="subtitle2"
            sx={{
              color: 'text.secondary',
            }}>
            {symbol}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          color="secondary"
          endIcon={<Icon icon={ArrowUpRightFilledIcon} />}
          onClick={viewOnExplorer}
          sx={{ borderRadius: 4 }}>
          View on Chain
        </Button>
      </ContentWrapper>
    </StyledPaper>
  );
}
