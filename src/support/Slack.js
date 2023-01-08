/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import crypto from 'crypto';
import { fetch } from './utils.js';

/**
 * Default notification URL.
 */
const DEFAULT_NOTIFY_URL = 'https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com/helix-services/slack-bot/v4/notify';

export default class Slack {
  constructor(config, projectConfig, notifySecret, log) {
    this._channels = Array.isArray(config) ? config : [config];
    this._notifySecret = notifySecret;
    this._notifyUrl = projectConfig.notify?.slack?.url ?? DEFAULT_NOTIFY_URL;
    this._log = log;
  }

  generateSignature(body) {
    return crypto
      .createHmac('sha1', this._notifySecret)
      .update(body, 'utf-8')
      .digest('hex');
  }

  /**
   * Post a message to some or all channels, creating a new entry
   *
   * @param {any} message message in Slack blocks
   * @returns result
   */
  async post(message, channel = undefined, reuse = undefined) {
    const payload = {
      channels: channel ? [channel] : this._channels,
      message,
    };
    if (reuse !== undefined) {
      payload.reuse = reuse;
    }
    return this._postToBot(JSON.stringify(payload));
  }

  /**
   * Update an exsting message in some channel
   *
   * @param {any} message message in Slack blocks
   * @param {string} ts message id
   * @param channel channel
   * @returns result
   */
  async update(message, ts, channel) {
    return this._postToBot(JSON.stringify({
      channels: [channel],
      message,
      ts,
    }));
  }

  /**
   * Post to the bot (internal implementation).
   *
   * @param {string} body stringified JSON body
   * @returns false or {object} if successful
   */
  async _postToBot(body) {
    const [, channel] = this.channels[0].split('/');
    if (!channel) {
      this._log.info(`No team id and channel in slack configuration: ${this._config}`);
      return false;
    }

    const signature = this.generateSignature(body);

    // hard-coded endpoint until slack-bot can be called directly
    const res = await fetch(this._notifyUrl, {
      method: 'POST',
      cache: 'no-store',
      body,
      headers: {
        'content-type': 'application/json;charset=utf-8',
        'x-helix-signature': signature,
      },
    });
    if (!res.ok) {
      this._log.info(`Unable to notify slack channels ${this.channels}, HTTP failure (${res.status})`, await res.text());
      return false;
    }
    const json = await res.json();

    const [result] = json;
    if (result.status !== 200) {
      this._log.info(`Unable to notify slack channels ${this.channels}, status returned: ${result.status}`);
      return false;
    }
    this._log.info(`Successfully notified slack channels [${this.channels}]`);
    return result;
  }

  get channels() {
    return this._channels;
  }
}
