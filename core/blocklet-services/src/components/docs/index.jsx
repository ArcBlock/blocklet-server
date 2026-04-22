import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Card, CardList } from './card-list';
import bg from './doc-board-bg.png';

function BoardCard({ board, sx, ...rest }) {
  return (
    <Card
      date={board.createdAt}
      sx={sx}
      to={board.link}
      title={board.title}
      desc={board.desc}
      cover={
        <Box
          sx={{
            position: 'relative',
            paddingTop: `${(9 / 16) * 100}%`,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
          }}>
          <Box
            component="img"
            src={bg}
            alt=""
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1,
              filter: (theme) => (theme.palette.mode === 'dark' ? 'brightness(0.28) contrast(1.1)' : 'none'),
            }}
          />
        </Box>
      }
      icon={board.icon}
      {...rest}
    />
  );
}

BoardCard.propTypes = {
  board: PropTypes.object.isRequired,
  sx: PropTypes.object.isRequired,
};

export default function BoardCardList() {
  const { locale } = useLocaleContext();
  const boards = [
    {
      id: '1',
      title: 'Blocklet Platform',
      desc: 'Guide to understand and build on our blocklet platform',
      icon: 'https://www.arcblock.io/favicon.ico',
      link: `https://www.arcblock.io/docs/blocklet-developer/${locale}/getting-started`,
    },

    {
      id: '2',
      title: 'Create Blocklet',
      desc: 'Build blocklet with just one command line.',
      icon: 'https://www.arcblock.io/favicon.ico',
      link: `https://www.arcblock.io/docs/createblocklet/${locale}/quick-start`,
    },

    {
      id: '3',
      title: 'Blocklet Launcher',
      desc: 'Streamlining Blocklet Launching.',
      icon: 'https://www.arcblock.io/docs/uploads/5a4f4716bc8061532a535fe816a9169c.png',
      link: `https://www.arcblock.io/docs/launcher/${locale}/launcher-welcome`,
    },
    {
      id: '4',
      title: 'DID Spaces',
      desc: 'Digital Spaces for Decentralized Identity (DID)',
      icon: 'https://www.arcblock.io/docs/uploads/3a8b142d7c940c57eced71eddba2ff19.png',
      link: `https://www.arcblock.io/docs/did-spaces/${locale}/did-spaces-getting-started`,
    },
    {
      id: '5',
      title: 'DID Wallet',
      desc: 'DID Wallet Support docs',
      icon: 'https://www.arcblock.io/docs/uploads/59ddb28f405ee670428e5fe1ff12d104.png',
      link: `https://www.arcblock.io/docs/did-wallet/${locale}/get-started`,
    },
    {
      id: '6',
      title: 'DID Names',
      desc: 'Naming Service based on NFT and verifiable credentials',
      icon: 'https://www.didnames.io/favicon.ico?imageFilter=resize&w=32',
      link: `https://www.arcblock.io/docs/did-domain/${locale}/did-domain-faq`,
    },
    {
      id: '7',
      title: 'Blockchain',
      desc: 'The ledger for ArcBlock ecosystem',
      icon: 'https://www.arcblock.io/docs/uploads/4a20c152faae0f104ed0815ff3b8b48b.png',
      link: `https://www.arcblock.io/docs/blockchain/${locale}/blockchain-how-to-guides`,
    },
    {
      id: '8',
      title: 'DID Connect',
      desc: 'The open protocol and development kit for connecting users and dapps',
      icon: 'https://www.arcblock.io/docs/uploads/d189118f89b56e9d5b03ad5a0212a4ab.png',
      link: `https://www.arcblock.io/docs/did-connect/${locale}/developer-guides`,
    },
  ];

  return (
    <CardList>
      {boards.map((x) => {
        return <BoardCard key={x.id} board={x} />;
      })}
    </CardList>
  );
}
