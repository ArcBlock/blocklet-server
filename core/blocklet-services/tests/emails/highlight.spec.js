const { describe, test, expect } = require('bun:test');
const { toClickableSpan } = require('../../api/emails/_libs/highlight');

describe('highlight function', () => {
  test('set highlight func default params', () => {
    const span1 = '<did:abt:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff>';
    expect(toClickableSpan(span1)).toBe(
      '<a target="_blank" style="color:#4598fa;font-weight:bold;" href="https://explorer.abtnetwork.io/explorer/accounts/z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff">DID</a>'
    );

    const span2 = '<PPP(did:beta:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff)> want to give you some tokens';
    expect(toClickableSpan(span2)).toBe(
      '<a target="_blank" style="color:#4598fa;font-weight:bold;" href="https://explorer.abtnetwork.io/explorer/accounts/z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff?host=https:%2F%2Fbeta.abtnetwork.io%2Fapi%2F">PPP</a> want to give you some tokens'
    );

    const span3 = '<P(P)P(did:xenon-2020-01-15:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff)> want to give you some tokens';
    expect(toClickableSpan(span3)).toBe(
      '<a target="_blank" style="color:#4598fa;font-weight:bold;" href="https://explorer.abtnetwork.io/explorer/accounts/z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff?host=https:%2F%2Fmain.abtnetwork.io%2Fapi%2F">P(P)P</a> want to give you some tokens'
    );

    const span4 =
      '<P(did:abt:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff)P(did:abt:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff)> want to give you some tokens';
    expect(toClickableSpan(span4)).toBe(span4);

    const span5 = '<P(x)P(did:abt:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff)> want to give you some tokens';
    expect(toClickableSpan(span5)).toBe(
      '<a target="_blank" style="color:#4598fa;font-weight:bold;" href="https://explorer.abtnetwork.io/explorer/accounts/z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff">P(x)P</a> want to give you some tokens'
    );

    const span6 = '<P(x)P(did:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff)> want to give you some tokens';
    expect(toClickableSpan(span6)).toBe(
      '<a target="_blank" style="color:#4598fa;font-weight:bold;" href="https://explorer.abtnetwork.io/explorer/accounts/z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff">P(x)P</a> want to give you some tokens'
    );

    const span7 = '<p(x)y(did:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff> want to give you some tokens';
    // NOTICE: 由于 类型 `P(X)Y(DID` 不存在，最终转换的链接为空
    expect(toClickableSpan(span7)).toBe(
      '<em style="font-weight:bold;" data-type="P(X)Y(DID" data-chain-id="z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff" data-did="z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff">P(X)Y(DID</em> want to give you some tokens'
    );
  });

  test('set highlight func second params', () => {
    const span1 = '<did:abt:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff>';
    expect(toClickableSpan(span1, false)).toBe('DID');

    const span2 = '<PPP(did:abt:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff)> want to give you some tokens';
    expect(toClickableSpan(span2, false)).toBe('PPP want to give you some tokens');

    const span3 = '<P(P)P(did:abt:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff)> want to give you some tokens';
    expect(toClickableSpan(span3, false)).toBe('P(P)P want to give you some tokens');

    const span4 =
      '<P(did:abt:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff)P(did:abt:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff)> want to give you some tokens';
    expect(toClickableSpan(span4, false)).toBe(span4);

    const span5 = '<P(x)P(did:abt:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff)> want to give you some tokens';
    expect(toClickableSpan(span5, false)).toBe('P(x)P want to give you some tokens');

    const span6 = '<P(x)P(did:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff)> want to give you some tokens';
    expect(toClickableSpan(span6, false)).toBe('P(x)P want to give you some tokens');

    const span7 = '<p(x)y(did:z1WAUarQi8Xm73emkHTTZpHsxhTwz2fHmff> want to give you some tokens';
    expect(toClickableSpan(span7, false)).toBe('P(X)Y(DID want to give you some tokens');
  });

  test('ocap playground notification', () => {
    const span1 =
      'User <DAMINGZHAO(did:abt:z1Y313EXfBK9FePjDh5cZy6sNY97TneEemB)> has a <Transaction(tx:beta:D20C566BB46A7B6B4DDEA0B42EB3996F0213C1C27C54533F3D40D7B5C6DA59FD)> and it will give your a <Badge (nft:beta:zjdivheWGgy6ucvsYYqP34hVeUgx6743GEfx)> on the DApp <OCAP Playground(dapp:beta:zNKeLKixvCM32TkVM1zmRDdAU3bvm3dTtAcM)>';
    expect(toClickableSpan(span1)).toBe(
      'User <a target="_blank" style="color:#4598fa;font-weight:bold;" href="https://explorer.abtnetwork.io/explorer/accounts/z1Y313EXfBK9FePjDh5cZy6sNY97TneEemB">DAMINGZHAO</a> has a <a target="_blank" style="color:#4598fa;font-weight:bold;" href="https://explorer.abtnetwork.io/explorer/txs/D20C566BB46A7B6B4DDEA0B42EB3996F0213C1C27C54533F3D40D7B5C6DA59FD?host=https:%2F%2Fbeta.abtnetwork.io%2Fapi%2F">Transaction</a> and it will give your a <a target="_blank" style="color:#4598fa;font-weight:bold;" href="https://explorer.abtnetwork.io/explorer/assets/zjdivheWGgy6ucvsYYqP34hVeUgx6743GEfx?host=https:%2F%2Fbeta.abtnetwork.io%2Fapi%2F">Badge </a> on the DApp <em style="font-weight:bold;" data-type="DAPP" data-chain-id="beta" data-did="zNKeLKixvCM32TkVM1zmRDdAU3bvm3dTtAcM">OCAP Playground</em>'
    );

    const span2 = '<DAMINGZHAO(did:abt:z1Y313EXfBK9FePjDh5cZy6sNY97TneEemB)> 购买了您的应用 DID Discuss';
    expect(toClickableSpan(span2)).toBe(
      '<a target="_blank" style="color:#4598fa;font-weight:bold;" href="https://explorer.abtnetwork.io/explorer/accounts/z1Y313EXfBK9FePjDh5cZy6sNY97TneEemB">DAMINGZHAO</a> 购买了您的应用 DID Discuss'
    );

    const span3 =
      '购买了您的应用 <DID Discuss(link:https://test.store.blocklet.dev/blocklets/z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu)>';
    expect(toClickableSpan(span3)).toBe(
      '购买了您的应用 <a target="_blank" style="color:#4598fa;font-weight:bold;" href="https://test.store.blocklet.dev/blocklets/z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu">DID Discuss</a>'
    );
  });
});
