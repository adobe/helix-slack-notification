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
 * @param {object} projectConfig project configuration
 * @param {object} payload payload received from SQS
 * @param {object} slack interface to post slack messages in the respective project
 * @returns true if notifying worked, otherwise false
 */
export default async function notify(projectConfig, payload, slack) {
  const { host } = projectConfig;
  const { added = [] } = payload.result;

  const items = added.map(({ path }) => `https://${host}${path}`);

  const lines = [];
  lines.push(`Published ${added.length} new article(s) :white_check_mark:`);

  const result = await slack.post({
    text: lines.join('\n'),
  });
  if (!result) {
    return false;
  }

  return slack.post({
    text: items.map((item) => `- ${item}`).join('\n'),
    unfurl_links: false,
    unfurl_media: false,
    ts: result.ts,
  });
}
