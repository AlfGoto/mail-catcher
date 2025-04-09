import { Construct } from "constructs"
import {
  aws_sns as sns,
  aws_ses as ses,
  aws_iam as iam,
  aws_sqs as sqs,
  aws_ssm as ssm,
  aws_sns_subscriptions as subs,
  Duration,
  Stack,
} from "aws-cdk-lib"
import * as cr from "aws-cdk-lib/custom-resources"
import * as fs from "fs"
import * as os from "os"
import path from "path"
import { Output } from "./types"
import * as actions from "aws-cdk-lib/aws-ses-actions"

export default class MailCatcher extends Construct {
  constructor(scope: Construct, id: string, mailAddress?: string) {
    super(scope, id)

    const topic = new sns.Topic(this, "MailCatcherTopic")

    const ruleSet = new ses.ReceiptRuleSet(this, "MailCatcherRuleSet", {
      receiptRuleSetName: "MailCatcherRuleSetName",
    })

    ruleSet.addRule("StoreEmailsInS3", {
      recipients: mailAddress ? [mailAddress] : [],
      actions: [
        new actions.Sns({
          topic: topic,
        }),
      ],
      scanEnabled: true,
      enabled: true,
    })

    const activateRuleSetCall: cr.AwsSdkCall = {
      service: "SES",
      action: "setActiveReceiptRuleSet",
      physicalResourceId: cr.PhysicalResourceId.of("ActivateRuleSet"),
      parameters: {
        RuleSetName: ruleSet.receiptRuleSetName,
      },
    }
    const deactivateRuleSetCall: cr.AwsSdkCall = {
      service: "SES",
      action: "setActiveReceiptRuleSet",
      physicalResourceId: cr.PhysicalResourceId.of("DeactivateRuleSet"),
      parameters: {
        RuleSetName: null,
      },
    }
    new cr.AwsCustomResource(this, "SetActiveReceiptRuleSetCustomResource", {
      onCreate: activateRuleSetCall,
      onUpdate: activateRuleSetCall,
      onDelete: deactivateRuleSetCall,
      installLatestAwsSdk: false,
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ["ses:SetActiveReceiptRuleSet"],
          resources: ["*"],
        }),
      ]),
    })

    const testQueue = new sqs.Queue(this, "MailCatcherQueue", {
      visibilityTimeout: Duration.seconds(10),
      retentionPeriod: Duration.days(1),
    })

    topic.addSubscription(new subs.SqsSubscription(testQueue))

    ////////////////////////////////////////////////////////////////////

    const ssmSqsName = "/mail-catcher/" + id + "/ssmsqsqueue"
    new ssm.StringParameter(this, "MailCatcherSsmSqsQueue", {
      parameterName: ssmSqsName,
      stringValue: testQueue.queueUrl,
    })

    const output: Output = {
      ssmsqsqueue: ssmSqsName,
      region: Stack.of(this).region,
      stackName: Stack.of(this).stackName,
    }

    const filePath = path.join(os.tmpdir(), "catch.output.json")
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2))
  }
}
