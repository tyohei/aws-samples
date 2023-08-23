import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import { Construct } from 'constructs';

export class NotebookInstanceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const instanceType = this.node.tryGetContext('instanceType');
    console.log(`Using ${instanceType} for instance type.`);

    const role = new iam.Role(this, 'Role', { assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com') });
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonForecastFullAccess'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSServiceCatalogEndUserFullAccess'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodePipeline_FullAccess'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchEventsFullAccess'));
    role.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['bedrock:*']
    }));

    const notebookInstance = new sagemaker.CfnNotebookInstance(this, 'NotebookInstance', {
      notebookInstanceName: 'CDK-Notebook-Instance',
      instanceType: instanceType,
      roleArn: role.roleArn,
      platformIdentifier: 'notebook-al2-v2',
      additionalCodeRepositories: ['https://github.com/aws/amazon-sagemaker-examples.git']
    });
  }
}
