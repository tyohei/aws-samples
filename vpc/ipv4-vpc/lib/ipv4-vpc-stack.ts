import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class Ipv4VpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const myIpAddress = this.node.tryGetContext('myIpAddress');

    const vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 2, natGateways: 1 });

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroupForRdp', { vpc: vpc });
    securityGroup.addIngressRule(ec2.Peer.ipv4(myIpAddress), ec2.Port.tcp(3389));
    securityGroup.addIngressRule(ec2.Peer.ipv4(myIpAddress), ec2.Port.udp(3389));

    const role = new iam.Role(this, 'Role', { assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com') });
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    const instaceProfile = new iam.InstanceProfile(this, 'InstanceProfile', { role: role });
  }
}
