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

/**
 * Notify slack in a specific format.
 *
 * @param {object} config operation configuration, may be undefined
 * @param {object} projectConfig project configuration
 * @param {object} payload payload received from SQS
 * @param {import('../support/Slack.js').default} slack slack interface
 * @param {object} log logger
 */
export default async function handle(config, projectConfig, payload, slack, log) {
  if (!payload.result) {
    log.warn('Payload has no \'result\' entry, ignored.');
    return;
  }

  const {
    notification: {
      path,
      results,
    },
  } = payload.result;

  if (results.length === 0) {
    await slack.post({
      text: `Processed \`${path}\` - no failures reported :white_check_mark:`,
    });
  } else if (!results[0].command) {
    await slack.post({
      text: `:x: Unable to process \`${path}\`: ${results[0].failure}`,
    });
  } else {
    const result = await slack.post({
      text: `:x: Processing \`${path}\` reported the following failures`,
    });
    const lines = results.map(({ command, failure }) => `\`${command}\`: ${failure}`);
    await slack.post({
      text: lines.map((line) => `- ${line}`).join('\n'),
      ts: result.ts,
    });
  }
}
