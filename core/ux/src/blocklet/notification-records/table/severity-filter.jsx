// SeverityFilter.jsx
import FilterComponent from './filter-component';
import NotificationSeverity from '../severity';

export default function SeverityFilter(props) {
  return <FilterComponent {...props} renderLabel={(x) => <NotificationSeverity severity={x} />} />;
}
