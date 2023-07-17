import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';

export class AuthenticateWithAuth0Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tokenIssuer = this.node.tryGetContext('tokenIssuer');
    const jwksUri = this.node.tryGetContext('jwksUri');
    const audience = this.node.tryGetContext('audience');

    // API Gateway
    const api = new apigw.RestApi(this, 'RESTAPI', {});

    // Lambda Authorizer
    const authorizerFunction = new lambdaNodejs.NodejsFunction(this, 'AuthorizerFunction', {
      entry: path.join(__dirname, '../functions/authorizer/index.ts'),
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TOKEN_ISSUER: tokenIssuer,
        JWKS_URI: jwksUri,
        AUDIENCE: audience
      }
    });
    const authorizer = new apigw.TokenAuthorizer(this, 'LambdaAuthorizer', {
      handler: authorizerFunction,
      identitySource: apigw.IdentitySource.header('Authorization'),
      validationRegex: '^Bearer [-0-9a-zA-z\.]*$',
      resultsCacheTtl: cdk.Duration.seconds(3600)
    });

    // Lambda
    // GET /
    const rootFunction = new lambdaNodejs.NodejsFunction(this, 'RootFunction', {
      entry: path.join(__dirname, '../functions/root/index.ts'),
      runtime: lambda.Runtime.NODEJS_18_X,
    });
    api.root.addMethod('GET', new apigw.LambdaIntegration(rootFunction), {
      authorizer: authorizer
    });
  }
}
