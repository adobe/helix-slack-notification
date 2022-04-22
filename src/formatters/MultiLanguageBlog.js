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

const LANGUAGE_TIMEZONE_MAP = new Map([
  ['en', 'America/Los_Angeles'],
  ['de', 'Europe/Berlin'],
  ['it', 'Europe/Rome'],
  ['fr', 'Europe/Paris'],
  ['uk', 'Europe/London'],
  ['jp', 'Asia/Tokyo'],
  ['ko', 'Asia/Seoul'],
  ['es', 'Europe/Madrid'],
  ['br', 'America/Sao_Paulo'],
]);

/**
 * Returns the next full hour (e.g. at 9:55 returns 10)
 * @param {string} timeZone name of time zone, e.g. America/Los_Angeles
 * @returns upcoming hours as number
 */
function getUpcomingHours(timeZone) {
  // compute hour and am/pm of upcoming hour in that time zone
  const upcoming = new Date(Date.now() + 60 * 60 * 1000);
  const localTime = upcoming.toLocaleString('en-US', { timeZone, hour12: true });
  // en-US representation is e.g. 6/1/2021, 6:45:12 AM
  const localHours = localTime.replace(/\d+\/\d+\/\d+, (\d+):\d+:\d+ ((A|P)M)/gm, '$1$2').toLowerCase();
  return localHours;
}

/**
 * Notify slack in a specific format.
 * @param {object} projectConfig project configuration
 * @param {object} payload payload received from SQS
 * @param {object} slack interface to post slack messages in the respective project
 * @returns true if notifying worked, otherwise false
 */
export default async function notify(projectConfig, payload, slack) {
  const { host } = projectConfig?.cdn?.prod || projectConfig;
  const { added = [] } = payload.result;

  const lines = [];
  const [, language] = added[0].path.split('/');
  const timeZone = LANGUAGE_TIMEZONE_MAP.get(language);
  if (timeZone) {
    const time = getUpcomingHours(timeZone);
    lines.push(`${time} push is live in \`${language}\` - ${added.length} new article(s) :white_check_mark:`);
  } else {
    lines.push(`${added.length} new article(s) in ${language} :white_check_mark:`);
  }

  const result = await slack.post({
    text: lines.join('\n'),
  });
  if (!result) {
    return false;
  }

  const items = added.map(({ path }) => (host ? `https://${host}${path}` : path));
  return slack.post({
    text: items.map((item) => `- ${item}`).join('\n'),
    unfurl_links: false,
    unfurl_media: false,
    ts: result.ts,
  });
}
