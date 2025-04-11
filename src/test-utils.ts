import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs"
import { readFileSync } from "fs"
import path from "path"
import os from "os"
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"
import {
  Output,
  SimpleMailOutput,
  WaitForMailEventOptions,
  WaitForMailReturnType,
} from "./types"

function createFilter(
  criteria: Partial<SimpleMailOutput>,
): (msg: any) => boolean {
  return (msg: any): boolean => {
    if (!msg?.mail?.commonHeaders) return false
    return Object.entries(criteria).every(
      ([key, value]) =>
        msg.mail.commonHeaders[key as keyof SimpleMailOutput] === value,
    )
  }
}

export default async function waitForMailEvent<T extends boolean = false>(
  options?: WaitForMailEventOptions<T>,
): Promise<WaitForMailReturnType<T>> {
  const f = process.cwd().split("/")
  const folderName = f[f.length - 1]
  const fileLocation = path.join(os.tmpdir(), `${folderName}.catch.output.json`)
  const mailConfig: Output = JSON.parse(readFileSync(fileLocation, "utf-8"))

  const ssmClient = new SSMClient({ region: mailConfig.region })
  const command = new GetParameterCommand({ Name: mailConfig.ssmsqsqueue })
  const data = await ssmClient.send(command)
  const queueUrl = data.Parameter?.Value
  if (!queueUrl) {
    throw new Error("Queue URL not found in the parameter store")
  }

  const client = new SQSClient({ region: mailConfig.region })
  const timeout = options?.maxWaitSeconds || 30
  const start = Date.now()

  const filterFn = options?.filter ? createFilter(options.filter) : () => true

  while ((Date.now() - start) / 1000 < timeout) {
    const res = await client.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        WaitTimeSeconds: 10,
        MaxNumberOfMessages: 1,
      }),
    )

    if (res.Messages?.[0]) {
      const message = res.Messages[0]
      const parsed = JSON.parse(message.Body!)
      const innerMessage = JSON.parse(parsed.Message)

      if (filterFn(innerMessage)) {
        await client.send(
          new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle!,
          }),
        )
        if (options?.complexMode) return innerMessage
        else return innerMessage.mail.commonHeaders
      }
    }
  }

  throw new Error("No email event matched the filter in time")
}
