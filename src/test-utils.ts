import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs"
import { readFileSync } from "fs"
import path from "path"
import os from "os"
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"
import { Output, WaitForMailEventOptions, WaitForMailReturnType } from "./types"

export default async function waitForMailEvent<T extends boolean = false>(
  options?: WaitForMailEventOptions<T>,
): Promise<WaitForMailReturnType<T>> {
  const mailConfig: Output = JSON.parse(
    readFileSync(path.join(os.tmpdir(), "catch.output.json"), "utf-8"),
  )

  const ssmClient = new SSMClient({
    region: mailConfig.region,
  })
  const command = new GetParameterCommand({ Name: mailConfig.ssmsqsqueue })
  const data = await ssmClient.send(command)
  const queueUrl = data.Parameter?.Value

  const client = new SQSClient({ region: mailConfig.region })

  const timeout = options?.maxWaitSeconds || 30
  const start = Date.now()

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
      if (!options?.filter || options.filter(parsed)) {
        await client.send(
          new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle!,
          }),
        )
        const json = JSON.parse(parsed.Message)
        if (options?.moreData) return json
        else return json.mail.commonHeaders
      }
    }
  }

  throw new Error("No email event matched the filter in time")
}
