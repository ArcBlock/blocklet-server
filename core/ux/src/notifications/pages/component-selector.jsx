/* eslint-disable react/require-default-props */
import { memo, useContext, useMemo, useState } from 'react';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import ListSubheader from '@mui/material/ListSubheader';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import ArrowDownwardIcon from '@arcblock/icons/lib/ArrowDown';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import BundleAvatar from '../../blocklet/bundle-avatar';

ComponentSelector.propTypes = {
  selectedId: PropTypes.string,
  blockletMap: PropTypes.object,
  onSelectChange: PropTypes.func,
  loading: PropTypes.bool,
  // 在 server 中查看消息可以过滤每一个 entity 中产生的消息，
  // 在 service 中查看消息，可以过滤 service 中每一个 component 产生的消息
  filterType: PropTypes.oneOf(['component', 'entity']),
};

const Div = styled.div`
  display: flex;
  justify-items: flex-start;
  align-items: center;
  gap: 8px;
  .name {
    display: block;
    max-width: 260px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

function ComponentSelector({
  selectedId = '',
  filterType = 'component',
  blockletMap = new Map(),
  onSelectChange = () => {},
  loading = false,
}) {
  const [searchText, setSearchText] = useState('');
  const { t } = useContext(LocaleContext);

  const handleSelectChange = (e) => {
    if (loading) {
      return;
    }
    const componentDid = e.target.value;
    onSelectChange(componentDid === 'all' ? '' : componentDid);
  };

  const blocklets = useMemo(() => {
    if (!blockletMap.size) {
      return [];
    }

    const result = [];
    Array.from(blockletMap).forEach(([, x]) => {
      const did = x.did || x.meta?.did;
      const title = x.title || x.meta?.title || '';
      const appDid = x.appPid || x.appDid;
      const matchTitle = title.toLowerCase().includes(searchText.toLowerCase());
      if (
        (filterType === 'component' && appDid !== did && matchTitle) ||
        (filterType === 'entity' && appDid === did && matchTitle)
      ) {
        result.push(x);
      }
    });
    return result;
  }, [blockletMap, searchText, filterType]);

  const selectedComponent = useMemo(() => {
    const target = blocklets.find((x) => (x.did || x.meta?.did) === selectedId);
    return target?.did || target?.meta?.did || selectedId || 'all';
  }, [blocklets, selectedId]);

  if (!blockletMap.size) {
    return null;
  }

  return (
    <FormControl sx={{ maxWidth: 240 }}>
      <Select
        value={selectedComponent}
        onChange={handleSelectChange}
        onClose={() => setSearchText('')}
        size="small"
        label="Sender"
        // eslint-disable-next-line react/no-unstable-nested-components
        IconComponent={(props) => <ArrowDownwardIcon {...props} width={20} height={20} />}
        MenuProps={{
          autoFocus: false,
          PaperProps: {
            style: {
              maxHeight: 400, // 设置最大高度为 200px
              overflowY: 'auto', // 确保内容可滚动
              borderRadius: '8px', // 添加圆角
              boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.15)',
            },
          },
        }}
        variant="outlined"
        sx={{
          fieldset: { border: 'none' },
        }}>
        <ListSubheader>
          <TextField
            autoFocus
            value={searchText}
            placeholder="Search"
            variant="outlined"
            size="small"
            fullWidth
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Escape') {
                e.stopPropagation();
              }
            }}
          />
        </ListSubheader>
        <MenuItem value="all">{t('notification.allSender')}</MenuItem>
        {filterType === 'component' && <MenuItem value="system">{t('notification.system')}</MenuItem>}
        {blocklets.map((x) => {
          const did = x.did || x.meta?.did;
          const title = x.title || x.meta?.title;
          return (
            <MenuItem key={did} value={did}>
              <Div>
                <BundleAvatar size={20} blocklet={x} ancestors={x.ancestors} style={{ borderRadius: 4 }} />
                <span className="name">{title}</span>
              </Div>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}
export default memo(ComponentSelector);
