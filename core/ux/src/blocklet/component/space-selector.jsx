import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { joinURL } from 'ufo';
import isUrl from 'is-url';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { TextField, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

import Toast from '@arcblock/ux/lib/Toast';
import { useSessionContext } from '../../contexts/session';

const DEFAULT_GATEWAY_LIST = [
  {
    value: 'https://www.didspaces.com/app',
    label: 'Prod DID Spaces',
    avatar: 'P',
  },
  {
    value: 'https://storage.staging.abtnet.io/app',
    label: 'Staging DID Spaces',
    avatar: 'S',
  },
];

const filter = createFilterOptions();

function SpaceSelector({
  onSelect,
  endpoint = undefined,
  gatewayUrl: defaultGatewayUrl = '',
  loading = false,
  size = 'small',
  helperText = '',
  ...rest
}) {
  const [gatewayList, setGatewayList] = useLocalStorage('did-space-gateway-list', DEFAULT_GATEWAY_LIST);
  const [gatewayUrl, setGatewayUrl] = useState(defaultGatewayUrl || DEFAULT_GATEWAY_LIST[0].value);

  const { t } = useLocaleContext();
  const { api } = useSessionContext();

  useEffect(() => {
    if (gatewayUrl && !gatewayList.find((x) => x.value === gatewayUrl)) {
      api
        .get(joinURL(gatewayUrl, '/__blocklet__.js?type=json'))
        .then((res) => {
          setGatewayList([...gatewayList, { value: gatewayUrl, label: res.data.appName }]);
        })
        .catch((err) => {
          console.error(err);
          Toast.error('Can not add this gateway, please check the url and try again');
        });
    }
  }, [gatewayUrl]); // eslint-disable-line

  return (
    <Container
      {...rest}
      freeSolo
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      value={gatewayUrl}
      options={gatewayList}
      onChange={(e, v) => {
        if (!v) {
          return;
        }

        if (typeof v === 'string') {
          const x = gatewayList.find((o) => o.label === v);
          if (x) {
            setGatewayUrl(x.value);
          }
        } else if (v.inputValue) {
          // Create a new value from the user input
          setGatewayUrl(v.inputValue);
        } else if (v.value) {
          setGatewayUrl(v.value);
        }
      }}
      getOptionLabel={(x) => {
        // Value selected with enter, right from the input
        if (typeof x === 'string') {
          return x;
        }

        // Add "xxx" x created dynamically
        if (x.inputValue) {
          return x.inputValue;
        }

        return x.label;
      }}
      renderOption={(props, x) => {
        return (
          <ListItem key={x.value} {...props}>
            <ListItemAvatar>
              <Avatar>{x.avatar}</Avatar>
            </ListItemAvatar>
            <ListItemText primary={x.label} secondary={x.value} />
          </ListItem>
        );
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);

        // Suggest the creation of a new value if its a valid url
        if (params.inputValue && isUrl(params.inputValue)) {
          const isExisting = options.some((x) => params.inputValue === x.value);
          if (!isExisting) {
            filtered.push({
              value: params.inputValue,
              label: 'Add new gateway',
            });
          }
        }

        return filtered;
      }}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            helperText={helperText}
            label={t('storage.spaces.label')}
            size={size}
            slotProps={{
              input: {
                ...params.InputProps,
                type: 'search',
                endAdornment: (
                  <Button
                    variant="contained"
                    onClick={() => onSelect(gatewayUrl)}
                    size="small"
                    loading={loading}
                    disable={loading}
                    sx={{
                      position: 'absolute',
                      right: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100px',
                      height: '100%',
                    }}>
                    {endpoint ? t('storage.spaces.reconnect') : t('storage.spaces.connect.now')}
                  </Button>
                ),
              },
            }}
          />
        );
      }}
    />
  );
}

const Container = styled(Autocomplete)`
  height: 40px;
  width: 100%;
  max-width: 720px;
  ${(props) => props.theme.breakpoints.down('md')} {
    width: 75%;
  }
  input.MuiInputBase-input {
    max-width: calc(100% - 80px);
  }
`;

SpaceSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
  endpoint: PropTypes.string,
  loading: PropTypes.bool,
  size: PropTypes.string,
  helperText: PropTypes.string,
  gatewayUrl: PropTypes.string,
};

export default SpaceSelector;
