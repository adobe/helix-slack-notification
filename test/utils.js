/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import assert from 'assert';
import nock from 'nock';

const FSTAB = `
mountpoints:
  /: https://drive.google.com/drive/folders/1gfqXGTDTsll26JdxkqCb6XEDOv1aym7y
`;

export function Nock() {
  const scopes = {};

  let unmatched;

  function noMatchHandler(req) {
    unmatched.push(req);
  }

  function nocker(url) {
    let scope = scopes[url];
    if (!scope) {
      scope = nock(url);
      scopes[url] = scope;
    }
    if (!unmatched) {
      unmatched = [];
      nock.emitter.on('no match', noMatchHandler);
    }
    return scope;
  }

  nocker.done = () => {
    Object.values(scopes).forEach((s) => s.done());
    if (unmatched) {
      assert.deepStrictEqual(unmatched.map((req) => req.options || req), []);
      nock.emitter.off('no match', noMatchHandler);
    }
  };

  nocker.fstab = (fstab = FSTAB, owner = 'owner', repo = 'repo') => nocker('https://helix-code-bus.s3.us-east-1.amazonaws.com')
    .get(`/${owner}/${repo}/main/fstab.yaml?x-id=GetObject`)
    .reply(200, fstab);

  nocker.helixConfig = (config = '', owner = 'owner', repo = 'repo', ref = 'ref') => nocker('https://helix-code-bus.s3.us-east-1.amazonaws.com')
    .get(`/${owner}/${repo}/${ref}/helix-config.json?x-id=GetObject`)
    .reply(config ? 200 : 404, config);

  nocker.helixConfigAll = (data, contentBusId = '2dc2835c6ee5a4c81403901bf504d49fcc4b2a4c4f0d5378cc4bec82a6c') => nocker('https://helix-content-bus.s3.us-east-1.amazonaws.com')
    .get(`/${contentBusId}/preview/.helix/config.json?x-id=GetObject`)
    .reply(data ? 200 : 404, data);

  return nocker;
}
