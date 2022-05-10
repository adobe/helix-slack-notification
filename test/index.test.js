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

  const env = {
    AWS_S3_REGION: 'us-east-1',
    AWS_S3_ACCESS_KEY_ID: 'access-key-id',
    AWS_S3_SECRET_ACCESS_KEY: 'secret-access-key',
    SLACK_NOTIFY_WEBHOOK_SECRET: 'webhook-secret',
  };

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
    nock.fstab();
    nock.helixConfig({});

    const result = await main(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
        }),
      }],
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles a missing notify configuration gracefully', async () => {
    nock.fstab();
    nock.helixConfig({
      data: [],
    });

    const result = await main(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
        }),
      }],
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles a missing slack configuration gracefully', async () => {
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'notify.index-published.format', value: 'plain',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
        }),
      }],
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles an unknown operation gracefully', async () => {
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'plain',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'marge-said-hi',
        }),
      }],
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles an unknown formatter gracefully', async () => {
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'plain',
      }],
    });
    const result = await main(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
        }),
      }],
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function skips an empty added section', async () => {
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'multi-language-blog',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
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
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles a missing result in the payload gracefully', async () => {
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'slack', value: 'T',
      }, {
        key: 'notify.index-published.format', value: 'multi-language-blog',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
        }),
      }],
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles a bad slack configuration gracefully', async () => {
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'slack', value: 'T',
      }, {
        key: 'notify.index-published.format', value: 'multi-language-blog',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
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
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index successfully notifies with host', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200, ts: 42 },
      ]))
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200 },
      ]));
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'host', value: 'localhost',
      }, {
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'multi-language-blog',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
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
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index successfully notifies with cdn.prod.host', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200, ts: 42 },
      ]))
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200 },
      ]));
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'cdn.prod.host', value: 'localhost',
      }, {
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'multi-language-blog',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
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
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index successfully notifies without host', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200, ts: 42 },
      ]))
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200 },
      ]));
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'multi-language-blog',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          ref: 'ref',
          op: 'index-published',
          result: {
            added: [{
              path: '/blog/test',
            }],
          },
        }),
      }],
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index successfully notifies on default without host', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200, ts: 42 },
      ]))
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200 },
      ]));
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'default',
      }],
    });
    const result = await main(new Request('https://localhost/'), {
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
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index successfully notifies on default with host', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200, ts: 42 },
      ]))
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200 },
      ]));
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'host', value: 'localhost',
      }, {
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'default',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
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
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index successfully notifies on default with cdn.prod.host', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200, ts: 42 },
      ]))
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 200 },
      ]));
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'cdn.prod.host', value: 'localhost',
      }, {
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'default',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
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
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index stops notifying when first message reports a failure', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(500);
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'multi-language-blog',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
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
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index stops notifying when first message reports a failure on default', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(500);
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'default',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
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
      env,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index stops notifying when first message reports a 403', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v2/notify')
      .reply(200, JSON.stringify([
        { status: 403 },
      ]));
    nock.fstab();
    nock.helixConfig({
      data: [{
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'multi-language-blog',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
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
      env,
    });
    assert.strictEqual(result.status, 200);
  });
});
