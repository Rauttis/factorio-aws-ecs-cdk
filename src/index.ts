import * as autoscaling from '@aws-cdk/aws-autoscaling'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as cdk from '@aws-cdk/cdk'
import * as efs from '@aws-cdk/aws-efs'

class FactorioECSCluster extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const vpc = new ec2.Vpc(this, 'FactorioVpc', { maxAZs: 2 })

    const efsSecurityGroup = new ec2.SecurityGroup(this, 'FactorioEFSSecurityGroup', { vpc })
    efsSecurityGroup.addIngressRule(efsSecurityGroup, new ec2.TcpPortRange(2049, 2049))

    const fileSystem = new efs.CfnFileSystem(this, 'FactorioFileSystem')
    const mount0 = new efs.CfnMountTarget(this, 'Subnet0Mount', {
      fileSystemId: fileSystem.fileSystemId,
      subnetId: vpc.publicSubnets[0].subnetId,
      securityGroups: [efsSecurityGroup.securityGroupId],
    })
    const mount1 = new efs.CfnMountTarget(this, 'Subnet1Mount', {
      fileSystemId: fileSystem.fileSystemId,
      subnetId: vpc.publicSubnets[1].subnetId,
      securityGroups: [efsSecurityGroup.securityGroupId],
    })

    const asgSecurityGroup = new ec2.SecurityGroup(this, 'FactorioEC2SecurityGroup', { vpc })
    asgSecurityGroup.addIngressRule(new ec2.AnyIPv4, new ec2.UdpPortRange(34197, 34197))
    // TODO: Limit ip
    asgSecurityGroup.addIngressRule(new ec2.AnyIPv4, new ec2.TcpPort(22))
    const asg = new autoscaling.AutoScalingGroup(this, 'FactorioAutoScalingGroup', {
      // TODO: instance type from param
      instanceType: new ec2.InstanceType('m3.medium'),
      machineImage: new ecs.EcsOptimizedAmi(),
      updateType: autoscaling.UpdateType.ReplacingUpdate,
      minCapacity: 1,
      maxCapacity: 1,
      desiredCapacity: 1,
      vpc,
      // TODO: spot price from param
      spotPrice: '0.05',
      associatePublicIpAddress: true,
      vpcSubnets: { subnetType: ec2.SubnetType.Public },
      // TODO: key name from params
      keyName: 'factorio'
    })
    asg.addUserData(`
      #!/bin/bash -xe
      yum install -y amazon-efs-utils
      mkdir /opt/factorio
      mount -t efs ${fileSystem.ref}:/ /opt/factorio
      chown 845:845 /opt/factorio
    `)
    asg.addSecurityGroup(asgSecurityGroup)
    asg.node.addDependency(fileSystem, mount0, mount1)

    const cluster = new ecs.Cluster(this, 'FactorioEcsCluster', { vpc })
    cluster.addAutoScalingGroup(asg)

    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'FactorioTaskDefinition')
    const VOLUME_NAME = 'FactorioVolume'
    taskDefinition.addVolume({
      name: VOLUME_NAME,
      host: {
        sourcePath: '/opt/factorio'
      }
    })

    const container = taskDefinition.addContainer('FactorioContainer', {
      // TODO: Get image from param
      image: ecs.ContainerImage.fromRegistry('factoriotools/factorio:stable'),
      memoryReservationMiB: 1024
    })
    container.addPortMappings(
      // Game port
      {containerPort: 34197, hostPort: 34197, protocol: ecs.Protocol.Udp},
      // Rcon port
      {containerPort: 27015, hostPort: 27015, protocol: ecs.Protocol.Tcp}
    )
    container.addMountPoints(
      {containerPath: '/factorio', sourceVolume: VOLUME_NAME, readOnly: false}
    )

    const service = new ecs.Ec2Service(this, 'FactorioService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      maximumPercent: 100,
      minimumHealthyPercent: 0
    })
  }
}

const app = new cdk.App()

new FactorioECSCluster(app, 'Factorio')

app.run()
