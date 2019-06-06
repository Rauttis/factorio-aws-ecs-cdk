# factorio-aws-ecs-cdk

AWS CDK project that deploys the infrastructure needed to run Factorio in ECS.

The stack creates:
- EFS for storing saves
- EC2 autoscaling group that allows you to terminate and spin up new EC2 instances with EFS mount for the ECS cluster
- ECS cluster
- ECS task definition
- ECS service

## Configuration

Configuration is currently hard-coded and can be edited in the source.

TODO: In the future it should be possible to configure via cdk.json or cloudformation parameters (TBD)
- EC2 instance on/off state (autoscaling group capacity)
- EC2 instance type
- spot pricing
- SSH key name
- Factorio image version
- Route53 hosted zone and subdomain

## Deployment

```
$ npm i
$ npm run deploy
```

## Connecting to the server

You can use the public DNS or IP found in the EC2 control panel. Port can be omitted as it is the default port used by Factorio (34197)

TODO: Make it possible for the stack to create a route53 record that points to the public ip.

## Modifying server configs / saves

Currently the only way to do this is to SSH to the EC2 instance. The saves and configs are located in `/opt/factorio`

## Updating Factorio

Update the image tag or if a rolling tag is used (latest, stable) you can force a new deployment in ECS to start an instance with the new image. If existing configs or saves stored in EFS are incompatible, they have to be replaced in the EFS volume. One way to do this is to simply remove them. They will be re-created once a new Factorio ECS instance boots.
