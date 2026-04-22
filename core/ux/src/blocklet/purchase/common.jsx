import PropTypes from 'prop-types';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconPurchase from '@mui/icons-material/ShoppingCart';
import IconVerify from '@mui/icons-material/VerifiedUser';
import Button from '@arcblock/ux/lib/Button';
import colors from '@arcblock/ux/lib/Colors';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

const commonProps = {
  meta: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
};

function CustomSelect({ action, onSelect, onNext }) {
  const { t } = useLocaleContext();
  const options = [
    {
      action: 'purchase',
      title: t('store.purchase.purchase.title'),
      description: t('store.purchase.purchase.description'),
    },
    {
      action: 'verify',
      title: t('store.purchase.verify.title'),
      description: t('store.purchase.verify.description'),
    },
  ];
  return (
    <>
      <List>
        {options.map((x) => (
          <ListItem button key={x.action} selected={action === x.action} onClick={() => onSelect(x.action)}>
            <ListItemIcon sx={{ minWidth: 48 }}>
              {x.action === 'purchase' ? (
                <IconPurchase style={{ color: action === 'purchase' ? colors.primary.main : '#AAA', fontSize: 32 }} />
              ) : (
                <IconVerify style={{ color: action === 'verify' ? colors.primary.main : '#AAA', fontSize: 32 }} />
              )}
            </ListItemIcon>
            <ListItemText primary={x.title} secondary={x.description} />
          </ListItem>
        ))}
      </List>
      {onNext && (
        <Button
          fullWidth
          disabled={!action}
          variant="contained"
          color="primary"
          style={{ marginTop: 16 }}
          onClick={onNext}>
          {t('common.next')}
        </Button>
      )}
    </>
  );
}
CustomSelect.propTypes = {
  action: PropTypes.oneOf(['both', 'purchase', 'verify']).isRequired,
  onSelect: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
};
export { commonProps, CustomSelect };
