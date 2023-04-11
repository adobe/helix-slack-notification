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
import { Request } from '@adobe/fetch';
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
  };
  const log = console;

  it('index function returns 204 when no notifications are available', async () => {
    const result = await main(new Request('https://localhost/'), { log });
    assert.strictEqual(result.status, 204);
  });

  it('index function handles a bad JSON body gracefully', async () => {
    const result = await main(new Request('https://localhost/'), {
      records: [{
        body: 'this is not JSON',
      }],
      log,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles a missing project configuration gracefully', async () => {
    nock.fstab();
    nock.helixConfig();
    nock.helixConfigAll({});

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
      log,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles a missing slack configuration gracefully', async () => {
    nock.fstab();
    nock.helixConfig();
    nock.helixConfigAll({
      data: [{}],
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
      log,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function handles an unknown operation gracefully', async () => {
    nock.fstab();
    nock.helixConfig();
    nock.helixConfigAll({
      data: [{
        key: 'slack', value: 'T/C',
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
      log,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function calls appropriate handler', async () => {
    nock.fstab();
    nock.helixConfig();
    nock.helixConfigAll({
      data: [{
        key: 'slack', value: 'T/C',
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
      log,
    });
    assert.strictEqual(result.status, 200);
  });

  it('index function calls appropriate handler (with its configuration)', async () => {
    nock.fstab();
    nock.helixConfig();
    nock.helixConfigAll({
      data: [{
        key: 'slack', value: 'T/C',
      }, {
        key: 'notify.index-published.format', value: 'multi-language-blog',
      }],
    });

    const result = await main(new Request('https://localhost/'), {
      records: [{
        body: JSON.stringify({
          Message: JSON.stringify({
            owner: 'owner',
            repo: 'repo',
            ref: 'ref',
            op: 'index-published',
          }),
        }),
      }],
      env,
      log,
    });
    assert.strictEqual(result.status, 200);
  });
});
