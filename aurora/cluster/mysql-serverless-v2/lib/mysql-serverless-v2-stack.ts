import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs';

export class MysqlServerlessV2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const myIpAddress = this.node.tryGetContext('myIpAddress');

    const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 2, natGateways: 1 });

    // Create a new EC2 instance
    const securityGroupForInstance = new ec2.SecurityGroup(this, 'SecurityGroupForInstance', { vpc: vpc });
    securityGroupForInstance.addIngressRule(ec2.Peer.ipv4(myIpAddress), ec2.Port.tcp(22));

    const role = new iam.Role(this, 'Role', { assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com') });
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    const image = ec2.MachineImage.fromSsmParameter('/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64');

    const instance = new ec2.Instance(this, 'Instance', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM),
      machineImage: image,
      securityGroup: securityGroupForInstance,
      role: role
    });

    // Create a new Aurora cluster with a single instance
    const securityGroupForCluster = new ec2.SecurityGroup(this, 'SecurityGroupForCluster', { vpc: vpc });
    securityGroupForCluster.addIngressRule(securityGroupForInstance, ec2.Port.tcp(3306));

    const cluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraMysql({ version: rds.AuroraMysqlEngineVersion.VER_3_03_0 }),
      writer: rds.ClusterInstance.serverlessV2('writer'),
      readers: [
        rds.ClusterInstance.serverlessV2('reader', { scaleWithWriter: true })
      ],
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [ securityGroupForCluster ]
    });
  }
}
