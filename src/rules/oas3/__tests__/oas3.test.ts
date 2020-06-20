import { outdent } from 'outdent';

import { validateDocument } from '../../../validate';
import { parseYamlToDocument, replaceSourceWithRef } from '../../../__tests__/utils';
import { LintConfig } from '../../../config/config';

const allConfig = new LintConfig({ extends: ['all'] });

describe('OAS3 Structural visitor basic', () => {
  it('should report wrong types', async () => {
    const document = parseYamlToDocument(
      outdent`
          openapi: 3.0.0
          tags:
            - 25.3
            - test
          servers:
          - url: 'http://example.com'
            variables:
              a:
                default: test
                enum:
                  - 123
                  - test
          info:
            title: Test
            version: '1.0'
            description: test description
            contact:
              name: string
              url: []
              email: false
            license: invalid
          paths: {}
        `,
      'foobar.yaml',
    );

    const results = await validateDocument({
      document,
      config: allConfig,
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`
      Array [
        Object {
          "location": Array [
            Object {
              "pointer": "#/tags/0",
              "reportOnKey": false,
              "source": "foobar.yaml",
            },
          ],
          "message": "Expected type 'Tag (object)' but got 'number'",
          "ruleId": "schema",
          "severity": "error",
        },
        Object {
          "location": Array [
            Object {
              "pointer": "#/tags/0",
              "reportOnKey": true,
              "source": "foobar.yaml",
            },
          ],
          "message": "Tag object description must be present.",
          "ruleId": "tag-description",
          "severity": "error",
        },
        Object {
          "location": Array [
            Object {
              "pointer": "#/tags/1",
              "reportOnKey": false,
              "source": "foobar.yaml",
            },
          ],
          "message": "Expected type 'Tag (object)' but got 'string'",
          "ruleId": "schema",
          "severity": "error",
        },
        Object {
          "location": Array [
            Object {
              "pointer": "#/tags/1",
              "reportOnKey": true,
              "source": "foobar.yaml",
            },
          ],
          "message": "Tag object description must be present.",
          "ruleId": "tag-description",
          "severity": "error",
        },
        Object {
          "location": Array [
            Object {
              "pointer": "#/servers/0/variables/a/enum/0",
              "reportOnKey": false,
              "source": "foobar.yaml",
            },
          ],
          "message": "Expected type 'string' but got 'number'",
          "ruleId": "schema",
          "severity": "error",
        },
        Object {
          "location": Array [
            Object {
              "pointer": "#/info/contact/url",
              "reportOnKey": false,
              "source": "foobar.yaml",
            },
          ],
          "message": "Expected type 'string' but got 'array'",
          "ruleId": "schema",
          "severity": "error",
        },
        Object {
          "location": Array [
            Object {
              "pointer": "#/info/contact/email",
              "reportOnKey": false,
              "source": "foobar.yaml",
            },
          ],
          "message": "Expected type 'string' but got 'boolean'",
          "ruleId": "schema",
          "severity": "error",
        },
        Object {
          "location": Array [
            Object {
              "pointer": "#/info/license",
              "reportOnKey": false,
              "source": "foobar.yaml",
            },
          ],
          "message": "Expected type 'License (object)' but got 'string'",
          "ruleId": "schema",
          "severity": "error",
        },
      ]
    `);
  });

  it('should report unexpected properties', async () => {
    const document = parseYamlToDocument(
      outdent`
          openapi: 3.0.0
          unexpected: 1
          info:
            title: Test
            version: '1.0'
            description: test description
            license:
              name: MIT
              url: google.com
            contact:
              name: string
              test: blah
              x-test: vendor
          paths: {}
        `,
      'foobar.yaml',
    );

    const results = await validateDocument({
      document,
      config: allConfig,
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`
      Array [
        Object {
          "location": Array [
            Object {
              "pointer": "#/unexpected",
              "reportOnKey": true,
              "source": "foobar.yaml",
            },
          ],
          "message": "Key 'unexpected' is not expected here",
          "ruleId": "schema",
          "severity": "error",
        },
        Object {
          "location": Array [
            Object {
              "pointer": "#/info/contact/test",
              "reportOnKey": true,
              "source": "foobar.yaml",
            },
          ],
          "message": "Key 'test' is not expected here",
          "ruleId": "schema",
          "severity": "error",
        },
      ]
    `);
  });

  it('should report required properties missing', async () => {
    const document = parseYamlToDocument(
      outdent`
          openapi: 3.0.0
          info:
            version: '1.0'
            description: test description
            license:
              name: MIT
              url: google.com
            contact:
              name: string
        `,
      'foobar.yaml',
    );

    const results = await validateDocument({
      document,
      config: allConfig,
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`
      Array [
        Object {
          "location": Array [
            Object {
              "pointer": "#/",
              "reportOnKey": true,
              "source": "foobar.yaml",
            },
          ],
          "message": "The field 'paths' must be present on this level.",
          "ruleId": "schema",
          "severity": "error",
        },
        Object {
          "location": Array [
            Object {
              "pointer": "#/info",
              "reportOnKey": true,
              "source": "foobar.yaml",
            },
          ],
          "message": "The field 'title' must be present on this level.",
          "ruleId": "schema",
          "severity": "error",
        },
      ]
    `);
  });
});