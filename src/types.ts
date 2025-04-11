export type Output = {
  ssmsqsqueue: string
  region: string
  stackName: string
}

export type SimpleMailOutput = {
  returnPath?: string
  from?: string[]
  date?: string
  to?: string[]
  messageId?: string
  subject?: string
}
export type ComplexMailOutput = {
  notificationType: "Received"
  mail: {
    timestamp: string
    source: string
    messageId: string
    destination: string[]
    headersTruncated: boolean
    headers: Array<{ [key: string]: string }>
    commonHeaders: SimpleMailOutput
  }
  receipt: {
    timestamp: string
    processingTimeMillis: number
    recipients: string[]
    spamVerdict: { status: "PASS" | "FAIL" | "GRAY" }
    virusVerdict: { status: "PASS" | "FAIL" | "GRAY" }
    spfVerdict: { status: "PASS" | "FAIL" | "GRAY" }
    dkimVerdict: { status: "PASS" | "FAIL" | "GRAY" }
    dmarcVerdict: { status: "PASS" | "FAIL" | "GRAY" }
    action: {
      type: "SNS"
      topicArn: string
      encoding: "UTF8"
    }
    dmarcPolicy: "none" | "quarantine" | "reject"
  }
  content: string
}

export type WaitForMailEventOptions<T extends boolean = false> = {
  maxWaitSeconds?: number;
  filter?: Partial<SimpleMailOutput>;
  complexMode?: T;
};

export type WaitForMailReturnType<T extends boolean> =
  T extends true ? ComplexMailOutput : SimpleMailOutput;