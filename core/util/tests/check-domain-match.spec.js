const { test, expect, describe } = require('bun:test');
const checkDomainMatch = require('../lib/check-domain-match');

describe('checkDomainMatch', () => {
  test('should have some test', () => {
    let match = checkDomainMatch('a.b.c', 'a.b.c');
    expect(match).toEqual(true);

    match = checkDomainMatch('b.c', '*.b.c');
    expect(match).toEqual(true);

    match = checkDomainMatch('*.b.c', 'b.c');
    expect(match).toEqual(true);

    match = checkDomainMatch('a.b.c', 'b.c');
    expect(match).toEqual(false);

    match = checkDomainMatch('b.c', 'a.b.c');
    expect(match).toEqual(false);

    match = checkDomainMatch('*.b.c', '*.b.c');
    expect(match).toEqual(true);

    match = checkDomainMatch('*.b.c', 'a.b.c');
    expect(match).toEqual(true);

    match = checkDomainMatch('not a domain', 'not a domain');
    expect(match).toEqual(true);

    match = checkDomainMatch('a.b.c', 'b.b.c');
    expect(match).toEqual(false);

    match = checkDomainMatch('*.b.c', 'a.c.c');
    expect(match).toEqual(false);

    match = checkDomainMatch('*.b.c', 'x.a.b.c');
    expect(match).toEqual(false);

    match = checkDomainMatch('', '');
    expect(match).toEqual(false);

    match = checkDomainMatch(null, '*.b.c');
    expect(match).toEqual(false);

    match = checkDomainMatch({}, '*.b.c');
    expect(match).toEqual(false);

    match = checkDomainMatch('http://*.b.c', 'http://a.b.c');
    expect(match).toEqual(false);

    match = checkDomainMatch('abtnode.com', '*.arcblock.io');
    expect(match).toEqual(false);

    match = checkDomainMatch('abtnode.com', 'arcblock.io');
    expect(match).toEqual(false);

    match = checkDomainMatch('ABtNODE.com', 'arcBLOCK.io');
    expect(match).toEqual(false);

    match = checkDomainMatch('ABtNODE.com', 'ABtnode.cOM');
    expect(match).toEqual(true);
  });
});
