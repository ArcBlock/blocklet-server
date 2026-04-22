/* eslint-disable quotes */
const { describe, expect, test } = require('bun:test');
const { sanitizeTag } = require('../lib/sanitize');

// 1. Basic script injection
// 2. Nested tags and broken closing bypass
// 3. HTML attribute injection
// 4. Encoding bypass (character encoding variants)
// 5. CSS expressions (old IE)
// 6. data URI disguised script injection
// 7. SVG/MathML vulnerable tags (modern browsers)
// 8. DOM-based XSS examples (tag-independent)
// 9. Obfuscated inline event syntax
// 10. Extreme combined attack cases (real-world bypass simulation)

const testCases = [
  // 1. Basic script tag injection
  { input: `<script>alert(1)</script>`, expectContains: '&lt;script&gt;alert(1)&lt;/script&gt;' },
  {
    input: `<SCRIPT SRC="http://evil.com/xss.js"></SCRIPT>`,
    expectContains: '&lt;SCRIPT SRC="http://evil.com/xss.js"&gt;&lt;/SCRIPT&gt;',
  },
  {
    input: `<script type="text/javascript">alert('XSS')</script>`,
    expectContains: '&lt;script type="text/javascript"&gt;alert(\'XSS\')&lt;/script&gt;',
  },

  // 2. Nested tags / broken closing
  {
    input: `<script<script><script>><script>alert(1)</script>`,
    expectContains: '&lt;script&lt;script&gt;&lt;script&gt;&gt;&lt;script&gt;alert(1)&lt;/script&gt;',
  },
  {
    input: `<<script>script>alert(1)//<</script>`,
    expectContains: '&lt;&lt;script&gt;script&gt;alert(1)//&lt;&lt;/script&gt;',
  },
  {
    name: 'script nested - 3',
    input: `<scr<script>ipt>alert(1)</scr</script>ipt>`,
    expectContains: '&lt;scr&lt;script&gt;ipt&gt;alert(1)&lt;/scr&lt;/script&gt;ipt&gt;',
  },

  // 3. HTML attribute injection
  {
    input: `<img src="x" onerror="alert(1)">`,
    expectContains: '&lt;img src="x" onerror="alert(1)"&gt;',
  },
  {
    input: `<body onload=alert('XSS')>`,
    expectContains: "&lt;body onload=alert('XSS')&gt;",
  },
  {
    input: `<input type="text" value="test" onfocus="alert(1)">`,
    expectContains: '&lt;input type="text" value="test" onfocus="alert(1)"&gt;',
  },

  // 4. href javascript protocol
  {
    input: `<a href="javascript:alert('XSS')">Click</a>`,
    expectContains: '&lt;a href="javascript:alert(\'XSS\')"&gt;Click&lt;/a&gt;',
  },
  {
    input: `<a href="JaVaScRiPt:alert(1)">link</a>`,
    expectContains: '&lt;a href="JaVaScRiPt:alert(1)"&gt;link&lt;/a&gt;',
  },
  {
    input: `<iframe src="javascript:alert(1)"></iframe>`,
    expectContains: '&lt;iframe src="javascript:alert(1)"&gt;&lt;/iframe&gt;',
  },

  // 5. Encoding variant bypass
  {
    input: `<script\x3ealert(1)\x3c/script>`,
    expectContains: '&lt;script&gt;alert(1)&lt;/script&gt;',
  },
  {
    input: `<svg/onload=&#97;&#108;&#101;&#114;&#116;(1)>`,
    expectContains: '&lt;svg/onload=&#97;&#108;&#101;&#114;&#116;(1)&gt;',
  },
  {
    input: `<IMG SRC=&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;:alert(1)>`,
    expectContains: '&lt;IMG SRC=&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;:alert(1)&gt;',
  },

  // 6. SVG/MathML tags
  {
    input: `<svg><animate onbegin=alert(1) attributeName=x dur=1s></animate></svg>`,
    expectContains: '&lt;svg&gt;&lt;animate onbegin=alert(1) attributeName=x dur=1s&gt;&lt;/animate&gt;&lt;/svg&gt;',
  },
  {
    input: `<svg><g onload="alert(1)"></g></svg>`,
    expectContains: '&lt;svg&gt;&lt;g onload="alert(1)"&gt;&lt;/g&gt;&lt;/svg&gt;',
  },
  {
    input: `<math><maction xlink:href="javascript:alert(1)">CLICK</maction></math>`,
    expectContains: '&lt;math&gt;&lt;maction xlink:href="javascript:alert(1)"&gt;CLICK&lt;/maction&gt;&lt;/math&gt;',
  },

  // 7. CSS expression
  {
    input: `<div style="width: expression(alert(1))">test</div>`,
    expectContains: '&lt;div style="width: expression(alert(1))"&gt;test&lt;/div&gt;',
  },
  {
    input: `<span style="background:url(javascript:alert(1))">x</span>`,
    expectContains: '&lt;span style="background:url(javascript:alert(1))"&gt;x&lt;/span&gt;',
  },
  {
    input: `<style>body{background-image: url("javascript:alert(1)")};</style>`,
    expectContains: '&lt;style&gt;body{background-image: url("javascript:alert(1)")};&lt;/style&gt;',
  },

  // 8. data URI
  {
    input: `<iframe src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="></iframe>`,
    expectContains: '&lt;iframe src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="&gt;&lt;/iframe&gt;',
  },
  {
    input: `<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">click</a>`,
    expectContains: '&lt;a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="&gt;click&lt;/a&gt;',
  },

  // 9. DOM-based XSS examples (special: one is enough)
  {
    input: `<img src=x onerror="location.hash='<script>alert(1)</script>'">`,
    expectContains: '&lt;img src=x onerror="location.hash=\'&lt;script&gt;alert(1)&lt;/script&gt;\'"&gt;',
  },

  // 10. Abnormal tag closing
  { input: `<script`, expectContains: '&lt;script' },
  { input: `<script\n>alert(1)</script>`, expectContains: '&lt;script\n&gt;alert(1)&lt;/script&gt;' },
  {
    input: `<<script>alert(1)//<</script>`,
    expectContains: '&lt;&lt;script&gt;alert(1)//&lt;&lt;/script&gt;',
  },
];

describe('sanitizeTag', () => {
  testCases.forEach(({ input, expectContains }) => {
    test(input, () => {
      const output = sanitizeTag(input);
      expect(output).toContain(expectContains);
    });
  });
});
