/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env mocha */
import assert from 'assert';
import esmock from 'esmock';
import { Request } from '@adobe/helix-fetch';
import { main } from '../src/index.js';
import { Nock } from './utils.js';

describe('Index Tests', () => {
  let nock;
  beforeEach(() => {
    nock = new Nock();
  });

  afterEach(() => {
    nock.done();
  });

  it('index function returns 204 when no notifications are available', async () => {
    const result = await main(new Request('https://localhost/'), {});
    assert.strictEqual(result.status, 204);
  });

  it('index function handles a bad JSON body gracefully', async () => {
    const result = await main(new Request('https://localhost/'), {
      records: [{
        body: 'this is not JSON',
      }],
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles a missing project configuration gracefully', async () => {
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => null,
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
        }),
      }],
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles a missing notify configuration gracefully', async () => {
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => ({
        }),
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
        }),
      }],
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles a missing slack configuration gracefully', async () => {
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => ({
          notify: {
            'index-published': {
              format: 'plain',
            },
          },
        }),
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
        }),
      }],
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles an unknown operation gracefully', async () => {
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => ({
          slack: 'T/C',
          notify: {
            'index-published': {
              format: 'plain',
            },
          },
        }),
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'marge-said-hi',
        }),
      }],
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles an unknown format gracefully', async () => {
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => ({
          slack: 'T/C',
          notify: {
            'index-published': {
              format: 'plain',
            },
          },
        }),
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
        }),
      }],
      env: {
        SLACK_NOTIFY_WEBHOOK_SECRET: 'secret',
      },
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function skips an empty added section', async () => {
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => ({
          slack: 'T/C',
          notify: {
            'index-published': {
              format: 'multi-language-blog',
            },
          },
        }),
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
          result: {
            added: [],
          },
        }),
      }],
      env: {
        SLACK_NOTIFY_WEBHOOK_SECRET: 'secret',
      },
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles a missing result in the payload gracefully', async () => {
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => ({
          slack: 'T',
          notify: {
            'index-published': {
              format: 'multi-language-blog',
            },
          },
        }),
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
        }),
      }],
      env: {
        SLACK_NOTIFY_WEBHOOK_SECRET: 'secret',
      },
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles a bad slack configuration gracefully', async () => {
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => ({
          slack: 'T',
          notify: {
            'index-published': {
              format: 'multi-language-blog',
            },
          },
        }),
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
          result: {
            added: [{
              path: '/en/test',
            }],
          },
        }),
      }],
      env: {
        SLACK_NOTIFY_WEBHOOK_SECRET: 'secret',
      },
    });
    assert.strictEqual(result.status, 200);
  });

  it('index successfully notifies', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200, ts: 42 },
      ]))
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200 },
      ]));
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => ({
          slack: 'T/C',
          notify: {
            'index-published': {
              format: 'multi-language-blog',
            },
          },
        }),
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
          result: {
            added: [{
              path: '/en/test',
            }],
          },
        }),
      }],
      env: {
        SLACK_NOTIFY_WEBHOOK_SECRET: 'secret',
      },
    });
    assert.strictEqual(result.status, 200);
  });

  it('index successfully notifies on default', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200, ts: 42 },
      ]))
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200 },
      ]));
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => ({
          slack: 'T/C',
          notify: {
            'index-published': {
              format: 'default',
            },
          },
        }),
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
          result: {
            added: [{
              path: '/test',
            }],
          },
        }),
      }],
      env: {
        SLACK_NOTIFY_WEBHOOK_SECRET: 'secret',
      },
    });
    assert.strictEqual(result.status, 200);
  });

  it('index stops notifying when first message reports a failure', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(500);
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => ({
          slack: 'T/C',
          notify: {
            'index-published': {
              format: 'multi-language-blog',
            },
          },
        }),
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
          result: {
            added: [{
              path: '/en/test',
            }],
          },
        }),
      }],
      env: {
        SLACK_NOTIFY_WEBHOOK_SECRET: 'secret',
      },
    });
    assert.strictEqual(result.status, 200);
  });

  it('index stops notifying when first message reports a failure on default', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(500);
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => ({
          slack: 'T/C',
          notify: {
            'index-published': {
              format: 'default',
            },
          },
        }),
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
          result: {
            added: [{
              path: '/en/test',
            }],
          },
        }),
      }],
      env: {
        SLACK_NOTIFY_WEBHOOK_SECRET: 'secret',
      },
    });
    assert.strictEqual(result.status, 200);
  });

  it('index stops notifying when first message reports a 403', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 403 },
      ]));
    const { main: proxyMain } = await esmock('../src/index.js', {
      '@adobe/helix-admin-support': {
        fetchProjectConfig: async () => ({
          slack: 'T/C',
          notify: {
            'index-published': {
              format: 'multi-language-blog',
            },
          },
        }),
      },
    });
    const result = await proxyMain(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
          result: {
            added: [{
              path: '/en/test',
            }],
          },
        }),
      }],
      env: {
        SLACK_NOTIFY_WEBHOOK_SECRET: 'secret',
      },
    });
    assert.strictEqual(result.status, 200);
  });
});
