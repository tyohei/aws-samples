import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';

export class SelfManagedAdOnEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const myIpAddress = this.node.tryGetContext('myIpAddress');

    const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 2, natGateways: 1 });
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', { vpc: vpc });
    securityGroup.addIngressRule(ec2.Peer.ipv4(myIpAddress), ec2.Port.tcp(3389));
    securityGroup.addIngressRule(ec2.Peer.ipv4(myIpAddress), ec2.Port.udp(3389));
    securityGroup.addIngressRule(securityGroup, ec2.Port.allTraffic());

    const role = new iam.Role(this, 'Role', { assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com') });
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMDirectoryServiceAccess'));

    const image = new ec2.WindowsImage(ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE);

    const instanceDomainController1 = new ec2.Instance(this, 'Domain-Controller-1', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.C6I, ec2.InstanceSize.LARGE),
      machineImage: image,
      securityGroup: securityGroup,
      role: role,
      keyName: `mykey-${cdk.Aws.REGION}`
    });

    const instanceDomainController2 = new ec2.Instance(this, 'Domain-Controller-2', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.C6I, ec2.InstanceSize.LARGE),
      machineImage: image,
      securityGroup: securityGroup,
      role: role,
      keyName: `mykey-${cdk.Aws.REGION}`
    });

    const instanceChildDomainController2 = new ec2.Instance(this, 'Child-Domain-Controller', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.C6I, ec2.InstanceSize.LARGE),
      machineImage: image,
      securityGroup: securityGroup,
      role: role,
      keyName: `mykey-${cdk.Aws.REGION}`
    });

    const instanceUser1 = new ec2.Instance(this, 'User-1', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.C6I, ec2.InstanceSize.LARGE),
      machineImage: image,
      securityGroup: securityGroup,
      role: role,
      keyName: `mykey-${cdk.Aws.REGION}`
    });
  }
}
