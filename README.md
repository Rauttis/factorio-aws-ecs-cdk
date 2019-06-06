# factorio-aws-ecs-cdk

AWS CDK project that deploys the infrastructure needed to run Factorio in ECS.

The stack creates:
- EFS for storing saves
- EC2 autoscaling group that allows you to terminate and spin up new EC2 instances with EFS mount for the ECS cluster
- ECS cluster
- ECS Task definition
- ECS Service

## Configuration

Configuration is currently hard-coded and can be edited in the source.

TODO: In the future it should be possible to configure 
- EC2 instance on/off state (autoscaling group capacity)
- EC2 instance type
- spot pricing
- SSH key name
- Factorio image version

## Deployment

```
$ npm i
$ npm run deploy
```
