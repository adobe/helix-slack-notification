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

import FORMATTERS from '../formatters/index.js';

/**
 * Notify slack in a specific format.
 * @param {object} config operation configuration
 * @param {object} projectConfig project configuration
 * @param {object} payload payload received from SQS
 * @param {object} slack interface to post slack messages in the respective project
 * @param {object} log logger
 */
export default async function handle(config, projectConfig, payload, slack, log) {
  const { format } = config;

  const formatter = FORMATTERS.get(format);
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
