/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */

const blocklets = {
  z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV: 'Static Demo',
  z8iZyVVn6XsvcuiYhtdw3GoasMbtqR9BjvJz3: 'Blockchain Explorer',
  z8iZqkCjLP6TZpR12tT3jESWxB8SGzNsx8nZa: 'NFT Store',
  z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu: 'Discuss Kit',
  z8ia5AUWNBoc5Jw6Zf2ru97W1y6PZVFiFa7h9: 'Coming Soon Page',
  z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o: 'Pages Kit',
  z8iZscGk6ohCejHEiX16C7apdFC7JrPYD1J4Z: 'Virtual Gift Card',
  z8ia2birZzhjbXqKnxPUUivmqErdsf3724tr6: 'NFT Maker',
  z8ia1ieY5KhEC4LMRETzS5nUwD7PvAND8qkfX: 'NFT Blender',
  z8iZqeUACK955YaBWqEd8aKg3tTki1GpvE2Wu: 'ArcBridge Node',
  z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ: 'Blocklet Store',
  z8ia2KGe3icfgRcVc9C1qCbWTBbpP2TrfPu7T: 'FS Chain Manager',
  z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ: 'AI Kit',
  z8iZvmERrWxqReWe1HZmkAaZvFeRpkXutfKDk: 'NFT Marketplace',
  z8iZpnScvjjeeyYZQoHSdXm4GQTqcfTTGkyPP: 'DID Wallet',
  z8iZrihfHTTBCBpDqCzrjFer5jop383b5hdPh: 'DID Spaces Enterprise',
  z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9: 'Image Bin',
  z8iZu6GDcVFaSsT7LjrBJC9uAfM6HKyQaCD9U: 'Tower Blocks',
  z8iZyhourKXqn8JKHbFcQDqWoAMsR6ZEi5nCW: 'Mine Sweeper',
  z8ia48jeqzdNhr9smse1tQCmt72G5PnSZaTax: 'MultiSig Vault',
  z8iZngXotuUXxsm6imc7naUUy1G5ycVs7A34H: 'Uptime Kuma',
  z8iZvMrKPa7qy2nxfrKremuSm8bE9Wb9Tu2NA: 'AI Assistant',
  z8ia2kJi2hdqASNBZzRiWQaZ8vshaxgQS67EW: 'DID Spaces Personal',
  z8iZpog7mcgcgBZzTiXJCWESvmnRrQmnd3XBB: 'AI Studio',
  z8iZxVUfZZBPpLhVov5YqsaorNX9F2vKAKeMc: 'Excalidraw',
  z8iZoLRKRXHzqdJ2vFZEi4H5UXT9ADsurxZRK: 'Tweet Token',
  z8ia5gwZog5Ut4TfUJP4k82fXKQN8iWZp2bfG: 'Token Prize Pool',
  z8iZorY6mvb5tZrxXTqhBmwu89xjEEazrgT3t: 'Meilisearch',
  z8iZy4P83i6AgnNdNUexsh2kBcsDHoqcwPavn: 'DID Pay',
  z8iZqTiD6tFwEub6t685e3dj18Ekbo8xvqBSV: 'Vote',
  z8iZkFBbrVQxZHvcWWB3Sa2TrfGmSeFz9MSU7: 'Server Launcher',
  z8iZhW61syFGfgMGDm7ttbDATUf4zbNrzxfJG: 'Blocklet Launcher',
  z8iZqxnmW2i3AbgmjuFki1J6KE8e5i5zBWB9k: 'Nostr Verifier',
  z8iZwyBfqwNcGbLCiUnFAQLEzT8sJd2TSjbM2: 'Static Demo',
  z8iZva6oERHPw7qveUwTBKcY8DqUUtcXheBX8: 'Form Builder',
  z8iZrdP3XNxaqzcHqTRewE3BdJiCfeMfNLzTc: 'AD Kit',
  z8ia2XJkmoZDwRBYzrvLqeZAHWz38Ptrz51xf: 'Tweet Assistant',
  z8ia2YJVK83HuwqykTVVe61mtNWEWeR6kVERi: 'aistro',
  z8ia5nxBkFetpK1BzaumvDStQiKyAuHdymnoh: 'Wait Genie',
};

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to update component title...');

  const apps = await states.blocklet.find({});

  for (const app of apps || []) {
    let shouldUpdate = false;
    for (const component of app.children || []) {
      const title = blocklets[component?.meta?.bundleDid];
      if (component?.meta && title && title !== component.meta.title) {
        component.meta.title = title;
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      await states.blocklet.update({ id: app.id }, { $set: { children: app.children } });
      printInfo(`Blocklet in blocklet.db updated: ${app.meta?.title}`);
    }
  }
};
