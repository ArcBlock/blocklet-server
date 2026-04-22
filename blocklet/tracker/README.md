# Blocklet Tracker

A library to facilitate blocklet tracking, sending tracking data to a backend, can only be used in browser.

## Usage

Import the library in your blocklet's `index.jsx` file.

```javascript
import '@blocklet/tracker';
```

Then you can use the `window.tracker` object to send tracking data to a backend.

```javascript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function App() {

  const location = useLocation();

  useEffect(() => {
    if (window.tracker && typeof window.tracker.pageView === 'function') {
      window.tracker.pageView(`${location.pathname}${location.search}`);
    }
  }, [location]);
}
```
