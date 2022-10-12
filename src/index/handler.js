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
import defaultFormatter from './default-formatter.js';
import multilangFormatter from './multilang-formatter.js';

const FORMATTERS = {
  default: defaultFormatter,
  'multi-language-blog': multilangFormatter,
};

/**
 * Notify slack in a specific format.
 * @param {object} config operation configuration, may be undefined
 * @param {object} projectConfig project configuration
 * @param {object} payload payload received from SQS
 * @param {import('../support/Slack.js').default} slack slack interface
 * @param {object} log logger
 */
export default async function handle(config, projectConfig, payload, slack, log) {
  if (!config) {
    log.info('Index notification handler requires a configuration in \'notify\', notification ignored.');
    return;
  }

  const { format } = config;

  const formatter = FORMATTERS[format];
  if (!formatter) {
    log.warn(`Unknown formatter: ${format}, ignored.`);
    return;
  }

  if (!payload.result) {
    log.warn('Payload has no \'result\' entry, ignored.');
    return;
  }

  const { added = [] } = payload.result;
  if (!added.length) {
    return;
  }

  log.info(`Received ${added.length} added item(s).`);
  await formatter(projectConfig, payload, slack);
}
