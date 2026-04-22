import InputBase from '@mui/material/InputBase';
import { mergeSx } from '@arcblock/ux/lib/Util/style';

export default function SearchInput(props) {
  return (
    <InputBase
      {...props}
      sx={mergeSx(
        theme => ({
          '.MuiInputBase-input': {
            borderRadius: 0,
            position: 'relative',
            border: '1px solid #bcbcbc',
            fontSize: 14,
            padding: '5px 25px 5px 10px',
            transition: theme.transitions.create(['border-color', 'box-shadow']),
            fontFamily: ['Avenir'].join(','),
            '&:focus': {
              borderRadius: 0,
              borderColor: '#80bdff',
              boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
            },
          },
        }),
        // eslint-disable-next-line react/prop-types
        props.sx
      )}
    />
  );
}
