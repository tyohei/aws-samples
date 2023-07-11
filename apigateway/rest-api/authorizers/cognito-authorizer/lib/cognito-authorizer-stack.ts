import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import { Construct } from 'constructs';

export class CognitoAuthorizerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const myEmail = this.node.tryGetContext('myEmail');

    // S3
    const bucket = new s3.Bucket(this, 'Bucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    new s3Deploy.BucketDeployment(this, 'S3DeployCats', {
      sources: [s3Deploy.Source.asset(path.join(__dirname, '../assets/cats'))],
      destinationBucket: bucket,
      destinationKeyPrefix: 'cats'
    });
    new s3Deploy.BucketDeployment(this, 'S3DeployDogs', {
      sources: [s3Deploy.Source.asset(path.join(__dirname, '../assets/dogs'))],
      destinationBucket: bucket,
      destinationKeyPrefix: 'dogs'
    });


    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      signInAliases: {
        username: true,
        email: true
      },
      signInCaseSensitive: true,
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(3)
      },
      mfa: cognito.Mfa.OFF,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      selfSignUpEnabled: false,
      autoVerify: {
        email: true
      },
      userVerification: {
        emailSubject: 'Verify your email for Cognito User Pool!!!',
        emailBody: 'Thanks for signing up! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE
      },
      deviceTracking: {
        challengeRequiredOnNewDevice: true,
        deviceOnlyRememberedOnUserPrompt: true
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const client = userPool.addClient('AppClient', {
      generateSecret: true,
      idTokenValidity: cdk.Duration.minutes(60),
      accessTokenValidity: cdk.Duration.minutes(60),
      refreshTokenValidity: cdk.Duration.days(30),
      authFlows: {
        userSrp: true,
      },
      preventUserExistenceErrors: true,
    });

    const user = new cognito.CfnUserPoolUser(this, 'User', {
      userPoolId: userPool.userPoolId,
      username: 'dev',
      userAttributes: [
        { name: 'email', value: myEmail }
      ]
    });

    // API Gateway
    const api = new apigw.RestApi(this, 'RESTAPI', {});
    const auth = new apigw.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });


    // IAM role
    const rootFunctionRole = new iam.Role(this, 'RootFunctionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    rootFunctionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
    rootFunctionRole.addToPolicy(new iam.PolicyStatement({
      resources: [ '*' ],
      actions: [ 'sts:AssumeRole' ]
    }));
    rootFunctionRole.addToPolicy(new iam.PolicyStatement({
      resources: [ '*' ],
      actions: [ 's3:*' ]
    }));

    const role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ArnPrincipal(rootFunctionRole.roleArn),
    });
    role.addToPolicy(new iam.PolicyStatement({
      resources: [ bucket.bucketArn, bucket.bucketArn + '/*' ],
      actions: [ 's3:ListBuckets', 's3:GetObject' ]
    }));

    // GET /
    const rootFunction = new lambdaNodejs.NodejsFunction(this, 'RootFunction', {
      entry: path.join(__dirname, '../functions/root/index.ts'),
      role: rootFunctionRole,
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        BUCKET_ARN: bucket.bucketArn,
        ROLE_ARN: role.roleArn,
      }
    });
    api.root.addMethod('GET', new apigw.LambdaIntegration(rootFunction), {
      authorizer: auth,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    // GET /bye
    const byeFunction = new lambdaNodejs.NodejsFunction(this, 'ByeFunction', {
      entry: path.join(__dirname, '../functions/bye/index.ts'),
      runtime: lambda.Runtime.NODEJS_18_X,
    });
    const byeResoure = api.root.addResource('bye');
    byeResoure.addMethod('GET', new apigw.LambdaIntegration(byeFunction), {
      authorizer: auth,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });
  }
}
