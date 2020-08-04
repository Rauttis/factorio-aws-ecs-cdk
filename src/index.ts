import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as cdk from '@aws-cdk/core'
import * as efs from '@aws-cdk/aws-efs'

import config, { IFactorioStackConfig } from './config'

class FactorioStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: IFactorioStackConfig) {
    super(scope, id)

    const vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 1, natGateways: 0 })

    const fileSystem = new efs.FileSystem(this, 'FileSystem', { vpc, removalPolicy: cdk.RemovalPolicy.DESTROY })

    const cluster = new ecs.Cluster(this, 'EcsCluster', { vpc })

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      cpu: props.cpu,
      memoryLimitMiB: props.memory,
    })

    const VOLUME_NAME = 'FactorioEfsVolume'

    // The CDK construct does not support EFS mounts yet, so we need to override it
    const cfnTaskDef = taskDefinition.node.defaultChild as ecs.CfnTaskDefinition
    cfnTaskDef.addPropertyOverride('Volumes', [
      {
        EFSVolumeConfiguration: {
          FilesystemId: fileSystem.fileSystemId,
        },
        Name: VOLUME_NAME,
      },
    ])

    const container = taskDefinition.addContainer('Container', {
      image: ecs.ContainerImage.fromRegistry(`factoriotools/factorio:${props.imageTag}`),
      memoryReservationMiB: props.memory,
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'Factorio' }),
    })
    container.addPortMappings(
      // Game port
      { containerPort: 34197, hostPort: 34197, protocol: ecs.Protocol.UDP },
      // Rcon port
      { containerPort: 27015, hostPort: 27015, protocol: ecs.Protocol.TCP }
    )
    container.addMountPoints({
      containerPath: '/factorio',
      sourceVolume: VOLUME_NAME,
      readOnly: false,
    })

    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      maxHealthyPercent: 100,
      minHealthyPercent: 0,
      assignPublicIp: true,
      // LATEST would be preferable, but it is currently at 1.3 which does not support EFS mounts
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
    })

    service.connections.allowFromAnyIpv4(ec2.Port.udp(34197))
    service.connections.allowFromAnyIpv4(ec2.Port.tcp(27015))
    fileSystem.connections.allowFrom(service, ec2.Port.tcp(2049))
  }
}

const app = new cdk.App()

new FactorioStack(app, 'Factorio', config)

app.synth()
