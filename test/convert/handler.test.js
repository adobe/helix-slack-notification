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
import convert from '../../src/convert/handler.js';

describe('Convert Handler Tests', () => {
  let nock;
  beforeEach(() => {
    nock = new Nock();
  });

  afterEach(() => {
    nock.done();
  });

  it('convert handles a missing result in the payload gracefully', async () => {
    await convert({}, {}, {
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

  it('convert successfully notifies', async () => {
    const messages = [
      { ts: '1', text: 'first message' },
      { ts: '2', text: 'second message' },
    ];
    await convert({}, {}, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'convert-update',
      result: {
        notification: {
          status: { message: 'Transcoding 50%' },
          userData: { ts: '2' },
        },
      },
    }, {
      update: (({ text }, ts) => {
        messages.find((m) => m.ts === ts).text = text;
      }),
    }, console);
    assert.strictEqual(messages[1].text, 'Transcoding 50%');
  });
});
