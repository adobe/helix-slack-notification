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
import index from '../../src/index/handler.js';

describe('Index Handler Tests', () => {
  let nock;
  beforeEach(() => {
    nock = new Nock();
  });

  afterEach(() => {
    nock.done();
  });

  it('index function handles a missing notify section gracefully', async () => {
    await index(null, {}, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'index-published',
    }, {
      post: () => assert.fail('Nothing should be posted to Slack'),
    }, console);
  });

  it('index function handles an unknown formatter gracefully', async () => {
    const config = {
      notify: {
        'index-published': {
          format: 'plain',
        },
      },
    };
    await index(config.notify['index-published'], config, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'index-published',
    }, {
      post: () => assert.fail('Nothing should be posted to Slack'),
    }, console);
  });

  it('index function skips an empty added section', async () => {
    const config = {
      notify: {
        'index-published': {
          format: 'multi-language-blog',
        },
      },
    };
    await index(config.notify['index-published'], config, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'index-published',
      result: {
        added: [],
      },
    }, {
      post: () => assert.fail('Nothing should be posted to Slack'),
    }, console);
  });

  it('index function handles a missing result in the payload gracefully', async () => {
    const config = {
      notify: {
        'index-published': {
          format: 'multi-language-blog',
        },
      },
    };
    await index(config.notify['index-published'], config, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'index-published',
    }, {
      post: () => assert.fail('Nothing should be posted to Slack'),
    }, console);
  });

  it('index successfully notifies on multi-language-blog with host', async () => {
    const posts = [];
    const config = {
      host: 'localhost',
      notify: {
        'index-published': {
          format: 'multi-language-blog',
        },
      },
    };
    await index(config.notify['index-published'], config, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'index-published',
      result: {
        added: [{
          path: '/en/test',
        }],
      },
    }, {
      post: (({ text }) => {
        posts.push(text);
        return {
          ts: posts.length,
        };
      }),
    }, console);
    assert.strictEqual(posts.length, 2);
    assert.strictEqual(posts[1], '- https://localhost/en/test');
  });

  it('index successfully notifies on multi-language-blog with cdn.prod.host', async () => {
    const posts = [];
    const config = {
      cdn: {
        prod: {
          host: 'localhost',
        },
      },
      notify: {
        'index-published': {
          format: 'multi-language-blog',
        },
      },
    };
    await index(config.notify['index-published'], config, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'index-published',
      result: {
        added: [{
          path: '/fi/test',
        }],
      },
    }, {
      post: (({ text }) => {
        posts.push(text);
        return {
          ts: posts.length,
        };
      }),
    }, console);
    assert.strictEqual(posts.length, 2);
    assert.strictEqual(posts[1], '- https://localhost/fi/test');
  });

  it('index successfully notifies on multi-language-blog without host', async () => {
    const posts = [];
    const config = {
      notify: {
        'index-published': {
          format: 'multi-language-blog',
        },
      },
    };
    await index(config.notify['index-published'], config, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'index-published',
      result: {
        added: [{
          path: '/en/test',
        }],
      },
    }, {
      post: (({ text }) => {
        posts.push(text);
        return {
          ts: posts.length,
        };
      }),
    }, console);
    assert.strictEqual(posts.length, 2);
    assert.strictEqual(posts[1], '- /en/test');
  });

  it('index function stops posting in multi-lang-blog if the first slack message is rejected', async () => {
    const posts = [];
    const config = {
      notify: {
        'index-published': {
          format: 'multi-language-blog',
        },
      },
    };
    await index(config.notify['index-published'], config, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'index-published',
      result: {
        added: [{
          path: '/en/test',
        }],
      },
    }, {
      post: (({ text }) => {
        posts.push(text);
        return false;
      }),
    }, console);
  });

  it('index successfully notifies on default with host', async () => {
    const posts = [];
    const config = {
      host: 'localhost',
      notify: {
        'index-published': {
          format: 'default',
        },
      },
    };
    await index(config.notify['index-published'], config, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'index-published',
      result: {
        added: [{
          path: '/test',
        }],
      },
    }, {
      post: (({ text }) => {
        posts.push(text);
        return {
          ts: posts.length,
        };
      }),
    }, console);
    assert.strictEqual(posts.length, 2);
    assert.strictEqual(posts[1], '- https://localhost/test');
  });

  it('index successfully notifies on default with cdn.prod.host', async () => {
    const posts = [];
    const config = {
      cdn: {
        prod: {
          host: 'localhost',
        },
      },
      slack: 'T/C',
      notify: {
        'index-published': {
          format: 'default',
        },
      },
    };
    await index(config.notify['index-published'], config, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'index-published',
      result: {
        added: [{
          path: '/test',
        }],
      },
    }, {
      post: (({ text }) => {
        posts.push(text);
        return {
          ts: posts.length,
        };
      }),
    }, console);
    assert.strictEqual(posts.length, 2);
    assert.strictEqual(posts[1], '- https://localhost/test');
  });

  it('index successfully notifies on default without host', async () => {
    const posts = [];
    const config = {
      notify: {
        'index-published': {
          format: 'default',
        },
      },
    };
    await index(config.notify['index-published'], config, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'index-published',
      result: {
        added: [{
          path: '/test',
        }],
      },
    }, {
      post: (({ text }) => {
        posts.push(text);
        return {
          ts: posts.length,
        };
      }),
    }, console);
    assert.strictEqual(posts.length, 2);
    assert.strictEqual(posts[1], '- /test');
  });

  it('index function stops posting in default if the first slack message is rejected', async () => {
    const posts = [];
    const config = {
      notify: {
        'index-published': {
          format: 'default',
        },
      },
    };
    await index(config.notify['index-published'], config, {
      owner: 'owner',
      repo: 'repo',
      ref: 'ref',
      op: 'index-published',
      result: {
        added: [{
          path: '/test',
        }],
      },
    }, {
      post: (({ text }) => {
        posts.push(text);
        return false;
      }),
    }, console);
  });
});
