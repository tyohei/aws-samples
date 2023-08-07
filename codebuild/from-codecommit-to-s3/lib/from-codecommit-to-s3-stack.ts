import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as cfOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as path from 'path';
import { Construct } from 'constructs';

export class FromCodecommitToS3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'Bucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const repo = new codecommit.Repository(this, 'Repository', {
      repositoryName: 'codebuild-nextjs-repository',
      code: codecommit.Code.fromDirectory(path.join(__dirname, '../frontend/example'))
    });

    const project = new codebuild.Project(this, 'Project', {
      buildSpec: codebuild.BuildSpec.fromAsset(path.join(__dirname, './buildspec.yml')),
      source: codebuild.Source.codeCommit({ repository: repo }),
      artifacts: codebuild.Artifacts.s3({
        bucket: bucket,
        packageZip: false,
        encryption: false
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5
      }
    });

    // https://github.com/aws/aws-cdk/issues/21771
    const oac = new cf.CfnOriginAccessControl(this, 'OAC', {
      originAccessControlConfig: {
        name: 'OAC', 
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',  // always | never | no-override
        signingProtocol: 'sigv4'
      }
    });

    const distribution = new cf.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new cfOrigins.S3Origin(bucket),
        allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,  // Some browsers sends OPTIONS requests to the server
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      }
    });
    const cfnDistribution = distribution.node.defaultChild as cf.CfnDistribution;
    // Enable OAC
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', oac.getAtt('Id'));
    // Disable OAI
    cfnDistribution.addPropertyOverride('DistributionConfig.S3Origin', undefined);
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity', '');

    bucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [bucket.arnForObjects('*')],
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        'StringEquals': {
          'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Aws.ACCOUNT_ID}:distribution/${distribution.distributionId}`
        }
      }
    }));
  }
}
