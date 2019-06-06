import * as cdk from '@aws-cdk/cdk'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as efs from '@aws-cdk/aws-efs'

export interface FileSystemProps {
  vpc: ec2.Vpc
}

export class FactorioFileSystem extends efs.CfnFileSystem {
  mounts: efs.CfnMountTarget[] = []

  constructor(parent: cdk.Construct, name: string, props: FileSystemProps) {
    super(parent, name)

    const efsSecurityGroup = new ec2.SecurityGroup(this, 'FactorioEFSSecurityGroup', { vpc: props.vpc })
    efsSecurityGroup.addIngressRule(efsSecurityGroup, new ec2.TcpPortRange(2049, 2049))

    this.mounts.push(
      new efs.CfnMountTarget(this, 'Subnet0Mount', {
        fileSystemId: this.fileSystemId,
        subnetId: props.vpc.publicSubnets[0].subnetId,
        securityGroups: [efsSecurityGroup.securityGroupId],
      }),
      new efs.CfnMountTarget(this, 'Subnet1Mount', {
        fileSystemId: this.fileSystemId,
        subnetId: props.vpc.publicSubnets[1].subnetId,
        securityGroups: [efsSecurityGroup.securityGroupId],
      })
    )
  }
}
