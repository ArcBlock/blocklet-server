import { Button, Section } from '@react-email/components';
import { actionsStyle, actionStyle } from '../_libs/style';

function Actions({
  actions,
}: {
  actions: {
    name?: string;
    title?: string;
    link?: string;
  }[];
}) {
  return actions.length > 0 ? (
    <Section style={actionsStyle}>
      {actions.map((item, index) => (
        <Button href={item.link} target="_blank" style={{ ...actionStyle, padding: '6px 12px' }} key={index}>
          {item.title || item.name}
        </Button>
      ))}
    </Section>
  ) : null;
}

export default Actions;
