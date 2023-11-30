import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam'
import * as docdb from 'aws-cdk-lib/aws-docdb';
import { Construct } from 'constructs';

export class ClusterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 2, natGateways: 1 });

    // Create a new EC2 instance
    const securityGroupForInstance = new ec2.SecurityGroup(this, 'SecurityGroupForInstance', { vpc: vpc });

    const role = new iam.Role(this, 'Role', { assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com') });
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    const image = new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 });

    const instance = new ec2.Instance(this, 'Instance', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM),
      machineImage: image,
      securityGroup: securityGroupForInstance,
      role: role
    });

    // Create a new DocumentDB cluster with two instances
    const securityGroupForCluster = new ec2.SecurityGroup(this, 'SecurityGroupForCluster', { vpc: vpc });
    securityGroupForCluster.addIngressRule(securityGroupForInstance, ec2.Port.tcp(27017));

    const cluster = new docdb.DatabaseCluster(this, 'Cluster', {
      masterUser: { username: 'myuser' },
      instances: 2,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.MEMORY6_GRAVITON, ec2.InstanceSize.LARGE),  // https://docs.aws.amazon.com/documentdb/latest/developerguide/db-instance-classes.html#db-instance-classes-by-region
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroup: securityGroupForCluster,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
