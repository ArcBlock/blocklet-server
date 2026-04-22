// StatusFilter.jsx
import FilterComponent from './filter-component';
import StatusDot from '../status-dot';

export default function StatusFilter(props) {
  return (
    <FilterComponent
      {...props}
      renderLabel={(x) => (
        <StatusDot enableTooltip={false} config={{ status: x.status }}>
          {x.label}
        </StatusDot>
      )}
    />
  );
}
