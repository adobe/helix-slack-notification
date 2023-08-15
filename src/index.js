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
import wrap from '@adobe/helix-shared-wrap';
import { helixStatus } from '@adobe/helix-status';
import { Response } from '@adobe/fetch';

import { fetchProjectConfig } from '@adobe/helix-admin-support';
import Slack from './support/Slack.js';

import convert from './convert/handler.js';
import cron from './cron/handler.js';
import index from './index/handler.js';

const HANDLERS = {
  'convert-update': convert,
  'cron-process': cron,
  'index-published': index,
};

/**
 * Handle a single notification received via SQS.
 */
async function handleNotification(payload, env, log) {
  const {
    owner, repo, ref, op,
  } = payload;

  const ctx = { attributes: [], env, log };
  const opts = {
    owner, repo, ref, path: '/',
  };

  const handler = HANDLERS[op];
  if (!handler) {
    log.debug(`Unknown operation in notification: ${op}, ignored.`);
    return;
  }

  log.info(`Received '${op}' notification for: ${owner}/${repo}/${ref}`);

  const projectConfig = await fetchProjectConfig(ctx, opts);
  if (!projectConfig) {
    log.warn(`Unable to load project configuration for: ${owner}/${repo}/${ref}, ignored.`);
    return;
  }

  const { slack: slackConfig } = projectConfig;
  if (!slackConfig) {
    log.warn(`No slack channel configured for ${owner}/${repo}/${ref}, ignored.`);
    return;
  }

  const slack = new Slack(slackConfig, projectConfig, env.SLACK_NOTIFY_WEBHOOK_SECRET, log);
  await handler(projectConfig?.notify?.[op], projectConfig, payload, slack, log);
}

/**
 * This is the main function
 * @param {Request} request the request object (see fetch api)
 * @param {UniversalContext} context the context of the universal serverless function
 * @returns {Response} a response
 */
async function run(request, context) {
  const { records = [], log } = context;
  if (records.length === 0) {
    // typically, this happens when the function isn't triggered by SQS but invoked "manually"
    return new Response('', { status: 204 });
  }
  await Promise.all(records.map(async ({ body }) => {
    try {
      let payload = JSON.parse(body);
      if (payload.Message) {
        payload = JSON.parse(payload.Message);
      }
      await handleNotification(payload, context.env, log);
    } catch (e) {
      log.warn(`Unable to handle notification: [${body}]`, e);
    }
  }));
  return new Response('', { status: 200 });
}

export const main = wrap(run)
  .with(helixStatus);
