import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { Construct } from 'constructs';

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new apigw.RestApi(this, 'RESTAPI', {});

    // GET /
    const rootFunction = new lambdaNodejs.NodejsFunction(this, 'RootFunction', {
      entry: path.join(__dirname, '../functions/root/index.ts')
    });
    api.root.addMethod('GET', new apigw.LambdaIntegration(rootFunction));

    // GET /bye
    const byeFunction = new lambdaNodejs.NodejsFunction(this, 'ByeFunction', {
      entry: path.join(__dirname, '../functions/bye/index.ts')
    });
    const byeResoure = api.root.addResource('bye');
    byeResoure.addMethod('GET', new apigw.LambdaIntegration(byeFunction));
  }
}
