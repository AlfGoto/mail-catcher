# Mail Catcher

A simple module to test your AWS-CDK mail sending services. **Mail Catcher** sets up the necessary AWS resources to help you test your email sending flows via AWS SES, S3, SNS, SQS, and SSM.

## Features

- **Email Storage in S3:** Emails are stored in a dedicated S3 bucket.
- **Notification System:** Uses SNS to publish notifications when emails arrive.
- **SES Receipt Rule:** Configured to store emails in S3 and send SNS notifications.
- **Queue Monitoring:** An SQS queue receives SNS messages, allowing you to monitor email events.
- **Configuration Storage:** SSM Parameter Store is used to retain the SQS queue URL.
- **Testing Utility:** Provides a helper (`waitForMailEvent`) to ease testing in your CDK stack.

## Installation

Install the package via npm:

```bash
npm install mail-catcher
```

## Usage

### In a CDK Stack

To integrate **Mail Catcher** in your AWS CDK stack, import and instantiate it. Make sure to provide a verified SES email address as the recipient.

```typescript
import MailCatcher from 'mail-catcher';

new MailCatcher(this, "MailCatcher", "contact@alfredgauthier.com");
```

> **Note:** The provided mail must be an approved email in SES.

### Testing Mail Events

For testing, the package includes a utility function `waitForMailEvent` which polls the SQS queue for mail events.

```typescript
import waitForMailEvent from 'mail-catcher/test-utils';

const random = Math.random().toString();
await fetch(apiUrl + random);

const mailEvent = await waitForMailEvent({
  maxWaitSeconds: 100,
  region: "eu-central-1",
});

expect(mailEvent.subject).toMatch(random);
```

## How It Works

1. **Resource Setup:**
   - **S3 Bucket:** Stores incoming emails with auto-deletion enabled upon stack removal.
   - **SNS Topic:** Used to forward notifications from S3 and SES.
   - **SES Receipt Rule Set:** Creates a rule that triggers on email receipt. The rule stores emails in S3 and sends notifications via SNS.
   - **SQS Queue:** Subscribed to the SNS topic to process email notification messages.
   - **SSM Parameter Store:** Persists the SQS queue URL for easy retrieval during testing.

2. **Custom Resource for SES Rule Set:**
   - An AWS Custom Resource is used to activate or deactivate the SES rule set automatically during stack creation and deletion.

3. **Testing Utility (`waitForMailEvent`):**
   - This function retrieves the SQS queue URL from SSM, waits for incoming email messages, deletes the processed messages, and filters the content based on user-defined criteria.

## Repository

For more details and to contribute, visit the [mail-catcher GitHub repository](https://github.com/AlfGoto/mail-catcher).

## Author

Created by **AlfGoto**.

## License

This project is licensed under the ISC License. See the [LICENSE](./LICENSE) file for details.
