import { Text } from '@react-email/components';

function ComposeItem({
  data,
  style = {},
}: {
  data: {
    color: string;
    text: string;
  };
  style?: object;
}) {
  return (
    <Text
      style={{
        color: data.color || 'initial',
        margin: 0,
        whiteSpace: 'pre-line !important' as 'pre-line',

        ...style,
      }}>
      {data.text}
    </Text>
  );
}

function Compose({ data }: { data: any[] }) {
  let i = 0;
  let content: any[] = [];
  while (i < data?.length) {
    const firstCol = data[i];
    const secondCol = data[i + 1];
    if (firstCol && secondCol) {
      content.push(
        <tr key={i}>
          <td>
            <ComposeItem data={firstCol.data} style={{ whiteSpace: 'nowrap' }} />
          </td>
          <td>
            <ComposeItem data={secondCol.data} style={{ wordBreak: 'break-word' }} />
          </td>
        </tr>
      );
    } else if (firstCol) {
      content.push(
        <tr key={i}>
          <td>
            <ComposeItem data={firstCol.data} />
          </td>
        </tr>
      );
    }

    i += 2;
  }

  return (
    <table style={{ width: '100%', margin: '1em 0' }}>
      <tbody>{content}</tbody>
    </table>
  );
}

export default Compose;
