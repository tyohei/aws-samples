import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as path from 'path';
import { Construct } from 'constructs';

export class DomainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 2, natGateways: 1 });

    const domainExecutionRole = new iam.Role(this, 'DomainExecutionRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('sagemaker.amazonaws.com'),
        new iam.ServicePrincipal('events.amazonaws.com'),  // https://docs.aws.amazon.com/sagemaker/latest/dg/scheduled-notebook-policies.html
        new iam.ServicePrincipal('bedrock.amazonaws.com'),
      )
    });
    domainExecutionRole.attachInlinePolicy(new iam.Policy(this, 'DomainRoleInlinePolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['iam:PassRole'],
          resources: ['arn:aws:iam::*:role/*']
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['bedrock:*'],
          resources: ['*']
        })
      ]
    }));
    domainExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'));
    domainExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonForecastFullAccess'));
    domainExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    domainExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'));
    domainExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
    domainExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSServiceCatalogEndUserFullAccess'));
    domainExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'));
    domainExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodePipeline_FullAccess'));
    domainExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchEventsFullAccess'));

    const functionRole = new iam.Role(this, 'FunctionRole', { assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com') });
    functionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
    functionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'));
    functionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ReadOnlyAccess'));
    functionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    functionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'));
    functionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'));
    functionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));
    functionRole.attachInlinePolicy(new iam.Policy(this, 'FunctionRoleInlinePolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['servicecatalog:*'],
          resources: ['*']
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['iam:PassRole'],
          resources: [domainExecutionRole.roleArn]
        })
      ]
    }));

    const enableSageMakerProjectsOnEvent = new lambda.Function(this, 'EnableSageMakerProjectsOnEvent', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../functions/enable_sagemaker_projects/on_event/')),
      handler: 'main.on_event',
      runtime: lambda.Runtime.PYTHON_3_10,
      role: functionRole
    });

    const enableSageMakerProjectsIsComplete = new lambda.Function(this, 'EnableSageMakerProjectsIsComplete', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../functions/enable_sagemaker_projects/is_complete/')),
      handler: 'main.is_complete',
      runtime: lambda.Runtime.PYTHON_3_10,
      role: functionRole
    });

    const enableSageMakerProjectsProvider = new cr.Provider(this, 'EnableSageMakerProjectsProvider', {
      onEventHandler: enableSageMakerProjectsOnEvent,
      isCompleteHandler: enableSageMakerProjectsIsComplete,
      logRetention: logs.RetentionDays.ONE_DAY
    });

    new cdk.CustomResource(this, 'EnableSageMakerProjects', {
      serviceToken: enableSageMakerProjectsProvider.serviceToken,
      properties: {
        ExecutionRole: domainExecutionRole.roleArn
      }
    });


    const delayOnEvent = new lambda.Function(this, 'DelayOnEvent', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../functions/delay/on_event/')),
      handler: 'main.on_event',
      runtime: lambda.Runtime.PYTHON_3_10,
      role: functionRole,
      timeout: cdk.Duration.seconds(660)
    });

    const delayIsComplete = new lambda.Function(this, 'DelayIsComplete', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../functions/delay/is_complete/')),
      handler: 'main.is_complete',
      runtime: lambda.Runtime.PYTHON_3_10,
      role: functionRole
    });

    const delayProvider = new cr.Provider(this, 'DelayProvider', {
      onEventHandler: delayOnEvent,
      isCompleteHandler: delayIsComplete,
      logRetention: logs.RetentionDays.ONE_DAY
    });

    // Adding a wait time after SageMakerExecutionRole creation
    const domainDeploymentDelay = new cdk.CustomResource(this, 'DomainDeploymentDelay', {
      serviceToken: delayProvider.serviceToken,
      properties: {
        TimeToWait: 300
      }
    });
    domainDeploymentDelay.node.addDependency(domainExecutionRole);


    // https://docs.aws.amazon.com/sagemaker/latest/dg/studio-jl.html
    const regionTable = new cdk.CfnMapping(this, 'RegionTable', {
      mapping: {
        'us-east-1': { imageAccountId: '081325390199' },
        'us-east-2': { imageAccountId: '429704687514' },
        'us-west-1': { imageAccountId: '742091327244' },
        'us-west-2': { imageAccountId: '236514542706' },
        'af-south-1': { imageAccountId: '559312083959' },
        'ap-east-1': { imageAccountId: '493642496378' },
        'ap-south-1': { imageAccountId: '394103062818' },
        'ap-southeast-1': { imageAccountId: '492261229750' },
        'ap-southeast-2': { imageAccountId: '452832661640' },
        'ap-northeast-1': { imageAccountId: '102112518831' },
        'ap-northeast-2': { imageAccountId: '806072073708' },
        'ca-central-1': { imageAccountId: '310906938811' },
        'eu-central-1': { imageAccountId: '936697816551' },
        'eu-west-1': { imageAccountId: '470317259841' },
        'eu-west-2': { imageAccountId: '712779665605' },
        'eu-west-3': { imageAccountId: '615547856133' },
        'eu-north-1': { imageAccountId: '243637512696' },
        'eu-south-2': { imageAccountId: '592751261982' },
        'sa-east-1': { imageAccountId: '782484402741' },
      }
    });

    // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sagemaker-domain.html
    // https://docs.aws.amazon.com/sagemaker/latest/dg/studio-jl.html
    const domain = new sagemaker.CfnDomain(this, 'Domain', {
      domainName: 'domain-v3',
      vpcId: vpc.vpcId,
      subnetIds: [
        vpc.privateSubnets[0].subnetId,
        vpc.privateSubnets[1].subnetId,
      ],
      appNetworkAccessType: 'PublicInternetOnly',
      authMode: 'IAM',
      defaultUserSettings: {
        executionRole: domainExecutionRole.roleArn,
        jupyterServerAppSettings: {
          defaultResourceSpec: {
            sageMakerImageArn: `arn:aws:sagemaker:${cdk.Stack.of(this).region}:${regionTable.findInMap(cdk.Stack.of(this).region, 'imageAccountId')}:image/jupyter-server-3`
          }
        }
      }
    });
    
    const user1 = new sagemaker.CfnUserProfile(this, 'User1', {
      domainId: domain.ref,
      userProfileName: 'user-1'
    });

    const user2 = new sagemaker.CfnUserProfile(this, 'User2', {
      domainId: domain.ref,
      userProfileName: 'user-2'
    });

  }
}
