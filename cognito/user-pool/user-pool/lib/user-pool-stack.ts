import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class UserPoolStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const myEmail = this.node.tryGetContext('myEmail');

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
  }
}
