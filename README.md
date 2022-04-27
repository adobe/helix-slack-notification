# Helix Slack Notification Service

Subscribes to Helix Admin notifications and sends them to Slack channels. Gets [triggered by AWS SQS](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html).

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/helix-slack-notification.svg)](https://codecov.io/gh/adobe/helix-slack-notification)
[![CircleCI](https://img.shields.io/circleci/project/github/adobe/helix-slack-notification.svg)](https://circleci.com/gh/adobe/helix-slack-notification)
[![GitHub license](https://img.shields.io/github/license/adobe/helix-slack-notification.svg)](https://github.com/adobe/helix-slack-notification/blob/main/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/helix-slack-notification.svg)](https://github.com/adobe/helix-slack-notification/issues)
[![LGTM Code Quality Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/adobe/helix-slack-notification.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/adobe/helix-slack-notification)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Installation

## Usage

```bash
curl https://helix-pages.anywhere.run/helix-services/slack-notification@v1
```

For more, see the [API documentation](docs/API.md).

## Development

### Deploying Helix Slack Notification Service

All commits to main that pass the testing will be deployed automatically. All commits to branches that will pass the testing will get commited as `/helix-services/slack-notification@ci<num>` and tagged with the CI build number.
