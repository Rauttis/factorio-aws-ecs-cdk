import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as cdk from '@aws-cdk/cdk'
import { FactorioFileSystem } from './file-system'
import { FactorioAutoScalingGroup } from './auto-scaling-group'

class FactorioECSCluster extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const vpc = new ec2.Vpc(this, 'FactorioVpc', { maxAZs: 2 })

    const fileSystem = new FactorioFileSystem(this, 'FactorioFileSystem', { vpc })
    const autoscalingGroup = new FactorioAutoScalingGroup(this, 'FactorioAutoScalingGroup', { vpc, fileSystem })

    const cluster = new ecs.Cluster(this, 'FactorioEcsCluster', { vpc })
    cluster.addAutoScalingGroup(autoscalingGroup)

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

    new ecs.Ec2Service(this, 'FactorioService', {
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
