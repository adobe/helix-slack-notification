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
import Slack from '../../src/support/Slack.js';
import { Nock } from '../utils.js';

describe('Slack Tests', () => {
  let nock;
  beforeEach(() => {
    nock = new Nock();
  });

  afterEach(() => {
    nock.done();
  });

  it('handles a bad slack configuration', async () => {
    const slack = new Slack('T', '', console);
    const result = await slack.post({
      text: 'hello world',
    });
    assert.strictEqual(result, false);
  });

  it('posts a message to all configured channels', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v4/notify')
      .reply((_, body) => {
        assert.deepStrictEqual(body, {
          channels: ['T1/C1', 'T2/C2'],
          message: {
            text: 'hello world',
          },
        });
        return [200, [{
          status: 200,
        }]];
      });

    const slack = new Slack(['T1/C1', 'T2/C2'], 'webhook-secret', console);
    const result = await slack.post({
      text: 'hello world',
    });
    assert.strictEqual(result.status, 200);
  });

  it('posts a message to some channel', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v4/notify')
      .reply((_, body) => {
        assert.deepStrictEqual(body, {
          channels: ['T1/C1'],
          message: {
            text: 'hello world',
          },
        });
        return [200, [{
          status: 200,
        }]];
      });

    const slack = new Slack(['T1/C1', 'T2/C2'], 'webhook-secret', console);
    const result = await slack.post({
      text: 'hello world',
    }, 'T1/C1');
    assert.strictEqual(result.status, 200);
  });

  it('pdates an existing message', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v4/notify')
      .reply((_, body) => {
        assert.deepStrictEqual(body, {
          channels: ['T1/C1'],
          message: {
            text: 'hello world',
          },
          ts: '1.2',
        });
        return [200, [{
          status: 200,
        }]];
      });

    const slack = new Slack(['T1/C1', 'T2/C2'], 'webhook-secret', console);
    const result = await slack.update({
      text: 'hello world',
    }, '1.2', 'T1/C1');
    assert.strictEqual(result.status, 200);
  });

  it('returns false when posting to slack bot fails (HTTP)', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v4/notify')
      .reply(403);

    const slack = new Slack('T/C', 'webhook-secret', console);
    const result = await slack.update({
      text: 'hello world',
    }, '1');
    assert.strictEqual(result, false);
  });

  it('returns false when posting to slack bot fails (Slack API)', async () => {
    nock('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com')
      .post('/slack/slack-bot/v4/notify')
      .reply(200, [{
        status: 404,
      }]);

    const slack = new Slack('T/C', 'webhook-secret', console);
    const result = await slack.update({
      text: 'hello world',
    }, '1');
    assert.strictEqual(result, false);
  });
});
