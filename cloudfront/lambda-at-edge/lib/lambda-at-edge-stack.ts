import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as cfOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as path from 'path';
import { Construct } from 'constructs';

export class LambdaAtEdgeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'Bucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-functions.html
    const edgeFunction = new cf.experimental.EdgeFunction(this, 'EdgeFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../functions/edge/'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c', [
              'export npm_config_cache=$(mktemp -d)',
              'npm i',
              'npx esbuild index.ts --platform=node --minify --bundle --outfile=index.js',
              'cp index.js /asset-output/'
            ].join('&&')
          ]
        }
      })
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
        edgeLambdas: [
          {
            functionVersion: edgeFunction.currentVersion,
            eventType: cf.LambdaEdgeEventType.VIEWER_REQUEST,
          }
        ]
      },
      defaultRootObject: 'index.html'
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
          'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${distribution.distributionId}`
        }
      }
    }));

    new s3Deployment.BucketDeployment(this, 'DeployHTML', {
      sources: [s3Deployment.Source.asset('./static')],
      destinationBucket: bucket,
      distribution: distribution,
      distributionPaths: ['/*']
    });

  }
}
