// FilterComponent.jsx
import PropTypes from 'prop-types';
import { FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox } from '@mui/material';

FilterComponent.propTypes = {
  filterList: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  column: PropTypes.object.isRequired,
  filterValues: PropTypes.array.isRequired,
  label: PropTypes.string.isRequired,
  renderLabel: PropTypes.func.isRequired,
};

export default function FilterComponent({ filterList, onChange, index, column, filterValues, label, renderLabel }) {
  return (
    <FormControl className="filter-container">
      <FormLabel component="legend">{label}</FormLabel>
      <FormGroup row>
        {filterValues.map((x) => (
          <FormControlLabel
            key={x.value ?? x}
            control={
              <Checkbox
                checked={filterList[index].indexOf(x.value ?? x) > -1}
                onChange={(event) => {
                  const newFilterList = [...filterList];
                  if (event.target.checked) {
                    newFilterList[index] = [...newFilterList[index], x.value ?? x];
                  } else {
                    newFilterList[index] = newFilterList[index].filter((v) => v !== (x.value ?? x));
                  }
                  onChange(newFilterList[index], index, column);
                }}
                name={x.value ?? x}
              />
            }
            label={<span style={{ display: 'flex', alignItems: 'center' }}>{renderLabel(x)}</span>}
          />
        ))}
      </FormGroup>
    </FormControl>
  );
}
