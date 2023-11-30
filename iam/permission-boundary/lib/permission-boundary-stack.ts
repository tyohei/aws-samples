import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class PermissionBoundaryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const switcherPermissionBoundary = new iam.ManagedPolicy(this, 'SwitcherPermissionBoundary', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ec2:*'],
          resources: ['*']
        })
      ]
    });

    const switcher = new iam.Role(this, 'Switcher', {
      assumedBy: new iam.AccountPrincipal(this.account),
      permissionsBoundary: switcherPermissionBoundary
    });
    switcher.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));
  }
}
