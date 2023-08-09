import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';

export class HelloNodejsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const func = new lambdaNodejs.NodejsFunction(this, 'Function', {
      entry: path.join(__dirname, '../functions/root/index.ts'),
      runtime: lambda.Runtime.NODEJS_18_X
    });

  }
}
