import styled from '@emotion/styled';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import AddIcon from '@mui/icons-material/Add';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';

import { useRoutingContext } from '../../contexts/routing';
import { useBlockletsContext } from '../../contexts/blocklets';
import { DomainStatusProvider } from '../../contexts/domain-status';

import AddDomain from './rule/action/add-domain';
import RuleItem from './rule/item';
import Permission from '../permission';

export default function RouterPage() {
  const { sites, allDomains } = useRoutingContext();
  const { data: blocklets } = useBlockletsContext();
  const { t } = useLocaleContext();

  const list = sites.map(x => {
    const items = x.items.filter(y => !y.isProtected);
    return { ...x, items };
  });

  return (
    <DomainStatusProvider domains={allDomains}>
      <Main>
        <Permission permission="mutate_router">
          <Box
            sx={{
              textAlign: 'right',
              mb: 1,
            }}>
            <AddDomain blocklets={blocklets}>
              {({ open }) => (
                <Button
                  style={{ marginLeft: 16 }}
                  variant="contained"
                  color="primary"
                  data-cy="add-domain-alias"
                  onClick={open}>
                  <AddIcon style={{ fontSize: '1.3em', marginRight: 4 }} />
                  {t('router.domain.addSite')}
                </Button>
              )}
            </AddDomain>
          </Box>
        </Permission>
        <List component="div" disablePadding>
          {list.map(x => (
            <RuleItem {...x} depth={1} key={x.id} />
          ))}
        </List>
      </Main>
    </DomainStatusProvider>
  );
}

const Main = styled.main`
  margin-top: ${props => props.theme.spacing(2)};
  min-height: 60vh;

  .MuiListItemIcon-root {
    min-width: ${props => props.theme.spacing(4)};
  }

  .site-header {
    display: flex;
    align-items: center;
    margin-left: ${props => props.theme.spacing(1)};
    font-size: 1.2rem;
  }

  .site-alias {
    display: flex;
    align-items: center;
    margin-left: ${props => props.theme.spacing(1)};
  }

  .site-secondary {
    margin-left: ${props => props.theme.spacing(1)};
  }

  .rule-list--depth1 {
    padding-left: ${props => props.theme.spacing(4)};
  }

  .rule-list--depth2 {
    padding-left: ${props => props.theme.spacing(5)};
  }

  .rule-action {
    margin-left: ${props => props.theme.spacing(2)};
  }

  .rule-name--depth2 span {
    font-weight: bold;
  }

  .arrow-name {
    display: flex;
    align-items: center;
    .arrow-name-left {
      width: 400px;
      flex-shrink: 0;
      text-align: left;
    }
    .arrow-name-middle {
      width: 150px;
      flex-shrink: 0;
      text-align: left;
    }
    .arrow-name-arrow {
      width: 40px;
      flex-shrink: 0;
      margin: auto 16px;
      font-size: 24px;
      color: #0000008a;
    }
    .arrow-name-right {
      flex-shrink: 0;
      display: flex;
      align-items: center;

      span {
        margin: 0 8px;
      }
    }
  }

  @media (max-width: ${props => props.theme.breakpoints.values.md}px) {
    .rule-list--depth1,
    .rule-list--depth2 {
      padding-left: 0;
    }

    .MuiListItem-secondaryAction {
      padding-right: 0;
    }
  }

  @media (max-width: ${props => props.theme.breakpoints.values.lg}px) {
    .arrow-icon {
      margin-top: 4px;
      align-self: flex-start;
    }

    .arrow-name {
      flex-direction: column;
      align-items: flex-start;
      .arrow-name-left {
        width: auto;
      }
      .arrow-name-middle {
        margin: 5px 0;
      }
      .arrow-name-arrow {
        display: none;
      }
    }
  }
`;
