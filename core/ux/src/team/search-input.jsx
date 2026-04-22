import styled from '@emotion/styled';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';

const SearchInput = styled(({ children, ...props }) => (
  <TextField
    {...props}
    id="outlined-basic"
    variant="outlined"
    size="small"
    slotProps={{
      input: {
        startAdornment: <SearchIcon />,
      },
    }}>
    {children}
  </TextField>
))`
  .MuiOutlinedInput-root {
    color: #999;
    &.MuiInputBase-adornedStart .MuiSvgIcon-root {
      color: #bfbfbf;
    }
    border-radius: 100vw;
  }

  .MuiOutlinedInput-notchedOutline,
  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline,
  .Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: #eee;
    border-width: 1px;
  }
`;

export default SearchInput;
