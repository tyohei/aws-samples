import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as cfOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as path from 'path';
import { Construct } from 'constructs';

export class DistributionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessLogs.html#AccessLogsBucketAndFileOwnership
    const distributionLogBucket = new s3.Bucket(this, 'DistributionLogBucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
    });

    const bucketServerAccessLogBucket = new s3.Bucket(this, 'BucketServerAccessLogBucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    const originBucket = new s3.Bucket(this, 'OriginBucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      serverAccessLogsBucket: bucketServerAccessLogBucket
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
        origin: new cfOrigins.S3Origin(originBucket),
        allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,  // Some browsers sends OPTIONS requests to the server
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      enableLogging: true,
      logBucket: distributionLogBucket
    });
    const cfnDistribution = distribution.node.defaultChild as cf.CfnDistribution;
    // Enable OAC
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', oac.getAtt('Id'));
    // Disable OAI
    cfnDistribution.addPropertyOverride('DistributionConfig.S3Origin', undefined);
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity', '');

    originBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [originBucket.arnForObjects('*')],
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        'StringEquals': {
          'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${distribution.distributionId}`
        }
      }
    }));

    new s3Deployment.BucketDeployment(this, 'DeployHTML', {
      sources: [s3Deployment.Source.asset('./static')],
      destinationBucket: originBucket,
      distribution: distribution,
      distributionPaths: ['/*']
    });
  }
}
