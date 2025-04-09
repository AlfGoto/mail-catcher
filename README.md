# Mail Catcher

**Mail Catcher** is a utility for testing email flows in your AWS CDK projects. It sets up SES, S3, SQS, and SNS automatically, so you can focus on writing integration tests that validate email delivery.

## Installation

```bash
npm install mail-catcher
```

## Exports

```ts
import {
  MailCatcher,
  waitForMailEvent,
  ComplexMailOutput,
  SimpleMailOutput,
} from "mail-catcher"
```

## Usage

### 1. Add Mail Catcher to Your Stack

```ts
new MailCatcher(this, "MailCatcher", "contact@yourdomain.com")
```

> You must use a verified **DOMAIN** in SES

### 2. Basic Wait for an Email

```ts
const mailEvent = await waitForMailEvent()
```

### 3. Match Content in Your Emails

Here we test an API that sends a custom object in the email subject:

```ts
const object = Math.random().toString()
await fetch(apiUrl + object) // Trigger email sending with custom object

const mailEvent = await waitForMailEvent({
  maxWaitSeconds: 100, // 30 by default
})

expect(mailEvent.subject).toMatch(object)
```

### 4. Filter on Email Content

You can filter received messages with your own logic:

```ts
const mailEvent = await waitForMailEvent({
  region: "eu-central-1",
  filter: (msg) =>
    JSON.parse(msg.Message).mail.commonHeaders.source ===
    "contact@yourdomain.com",
  // JSON.parse(msg.Message) is of type ComplexMailOutput
})
```
>You should filter your mails

### 5. If You Need More Email Data

```ts
const mailEvent = await waitForMailEvent({
  moreData: true,
  region: "eu-central-1",
})
console.log(mailEvent.mail.source) // access full email object
```

You can use `ComplexMailOutput` and `SimpleMailOutput` for typing.

## Why Use It

- No manual SES/S3/SQS setup.
- Write reliable tests for email flows.
- Validate real email content in CI.

## GitHub

[github.com/AlfGoto/mail-catcher](https://github.com/AlfGoto/mail-catcher)

## License

ISC
