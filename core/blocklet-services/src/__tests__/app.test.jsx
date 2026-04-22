import { createRoot } from 'react-dom/client';
// eslint-disable-next-line import/no-named-as-default
import App from '../app';

it('renders without crashing', () => {
  const div = createRoot(document.createElement('div'));
  div.render(<App />);
  div.unmount(div);
});
