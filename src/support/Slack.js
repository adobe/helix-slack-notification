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

export default class Slack {
  constructor(config, notifySecret, log) {
    this._config = config;
    this._notifySecret = notifySecret;
    this._log = log;
  }

  generateSignature(body) {
    return crypto
      .createHmac('sha1', this._notifySecret)
      .update(body, 'utf-8')
      .digest('hex');
  }

  async post(message) {
    const [, channel] = this._config.split('/');
    if (!channel) {
      this._log.info(`No team id and channel in slack configuration: ${this._config}`);
      return false;
    }

    const body = JSON.stringify({
      channels: [this._config],
      message,
    });

    const signature = this.generateSignature(body);

    // hard-coded endpoint until slack-bot can be called directly
    const res = await fetch('https://lqmig3v5eb.execute-api.us-east-1.amazonaws.com/slack/slack-bot/v4/notify', {
      method: 'POST',
      cache: 'no-store',
      body,
      headers: {
        'content-type': 'application/json;charset=utf-8',
        'x-helix-signature': signature,
      },
    });
    if (!res.ok) {
      this._log.info(`Unable to notify slack channel [${this._config}], HTTP failure (${res.status})`, await res.text());
      return false;
    }
    const json = await res.json();

    const [result] = json;
    if (result.status !== 200) {
      this._log.info(`Unable to notify slack channel[${this._config}], status returned: ${result.status}`);
      return false;
    }
    this._log.info(`Successfully notified slack channel[${this._config}]`);
    return result;
  }
}
