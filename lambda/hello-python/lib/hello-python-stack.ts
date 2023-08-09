import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { Construct } from 'constructs';

export class HelloPythonStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const func = new lambda.Function(this, 'Function', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../functions/root')),
      handler: 'main.handler',
      runtime: lambda.Runtime.PYTHON_3_9,
    });

  }
}
