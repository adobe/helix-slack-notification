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
import { Nock } from '../utils.js';
import cron from '../../src/cron/handler.js';

describe('Cron Handler Tests', () => {
  let nock;
  beforeEach(() => {
    nock = new Nock();
  });

  afterEach(() => {
    nock.done();
  });

  it('cron handles a missing result in the payload gracefully', async () => {
    await cron({}, {}, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'convert-update',
      notification: {
        status: { message: 'Transcoding 50%' },
        userData: { ts: '2' },
      },
    }, {
      post: () => assert.fail('Nothing should be posted to Slack'),
    }, console);
  });

  it('cron handles a successful operation', async () => {
    await cron({}, {}, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'cron-process',
      result: {
        notification: {
          path: '/list.json',
          results: [],
        },
      },
    }, {
      post: ({ text }) => assert.match(text, /no failures reported/),
    }, console);
  });

  it('cron handles a failed fetch of the list to process', async () => {
    await cron({}, {}, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'cron-process',
      result: {
        notification: {
          path: '/list.json',
          results: [{
            failure: 'Fetching preview of \'/list.json\' failed: (404)',
          }],
        },
      },
    }, {
      post: ({ text }) => assert.match(text, /Unable to process `\/list.json`/),
    }, console);
  });

  it('cron handles a list of failures', async () => {
    const posts = [];
    await cron({}, {}, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'cron-process',
      result: {
        notification: {
          path: '/list.json',
          results: [{
            command: 'make coffee(now)',
            failure: 'command \'make coffee\' not found.',
          }],
        },
      },
    }, {
      post: ({ text }) => posts.push(text),
    }, console);
    assert.deepStrictEqual(posts, [
      ':x: Processing `/list.json` reported the following failures',
      '- `make coffee(now)`: command \'make coffee\' not found.',
    ]);
  });
});
