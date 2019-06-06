import * as cdk from '@aws-cdk/cdk'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as autoscaling from '@aws-cdk/aws-autoscaling'
import { FactorioFileSystem } from './file-system'

export interface FactorioAutoscalingGroupProps {
  vpc: ec2.Vpc
  fileSystem: FactorioFileSystem
}

export class FactorioAutoScalingGroup extends autoscaling.AutoScalingGroup {
  constructor(parent: cdk.Construct, name: string, props: FactorioAutoscalingGroupProps) {
    super(parent, name, {
       // TODO: instance type from param
       instanceType: new ec2.InstanceType('m3.medium'),
       machineImage: new ecs.EcsOptimizedAmi(),
       updateType: autoscaling.UpdateType.ReplacingUpdate,
       minCapacity: 1,
       maxCapacity: 1,
       desiredCapacity: 1,
       vpc: props.vpc,
       // TODO: spot price from param
      spotPrice: '0.05',
      associatePublicIpAddress: true,
      vpcSubnets: { subnetType: ec2.SubnetType.Public },
      // TODO: key name from params
      keyName: 'factorio'
    })

    const asgSecurityGroup = new ec2.SecurityGroup(this, 'FactorioEC2SecurityGroup', { vpc: props.vpc })
    asgSecurityGroup.addIngressRule(new ec2.AnyIPv4, new ec2.UdpPortRange(34197, 34197))
    // TODO: Limit ip
    asgSecurityGroup.addIngressRule(new ec2.AnyIPv4, new ec2.TcpPort(22))

    this.addUserData(`
      #!/bin/bash -xe
      yum install -y amazon-efs-utils
      mkdir /opt/factorio
      mount -t efs ${props.fileSystem.ref}:/ /opt/factorio
      chown 845:845 /opt/factorio
    `)
    this.addSecurityGroup(asgSecurityGroup)
    this.node.addDependency(props.fileSystem, ...props.fileSystem.mounts)
  }
}
