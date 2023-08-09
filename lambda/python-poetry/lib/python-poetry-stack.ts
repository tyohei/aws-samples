import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaPython from '@aws-cdk/aws-lambda-python-alpha';
import * as path from 'path';
import { Construct } from 'constructs';

export class PythonPoetryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const func = new lambdaPython.PythonFunction(this, 'Function', {
      entry: path.join(__dirname, '../functions/root'),
      index: 'root/index.py',
      runtime: lambda.Runtime.PYTHON_3_9
    });

  }
}
