import Button from '@arcblock/ux/lib/Button';

export default function StyledButton({ ...props }) {
  return <Button className="bottom-button" variant="contained" color="primary" {...props} />;
}
