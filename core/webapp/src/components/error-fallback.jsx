/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable react/prop-types */
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@arcblock/ux/lib/Button';
import Center from '@arcblock/ux/lib/Center';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Center>
      <Alert
        severity="error"
        action={
          <Button onClick={resetErrorBoundary} color="secondary" variant="outlined">
            Reload
          </Button>
        }
        style={{ minWidth: 480 }}>
        <AlertTitle>Oops, this application crashed</AlertTitle>
        <Typography>{error.message}</Typography>
      </Alert>
    </Center>
  );
}

export default ErrorFallback;
