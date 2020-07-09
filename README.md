# factorio-aws-ecs-cdk

AWS CDK project that deploys the infrastructure needed to run Factorio in ECS.

The stack creates:

- EFS for storing saves
- ECS cluster
- ECS Fargate task definition
- ECS Fargate service

## Configuration

Configuration is currently hard-coded and can be edited in the source.

## Deployment

```
$ npm i
$ npm run deploy
```

## Connecting to the server

You can use the public IP found in the ECS task details.

## Updating Factorio

Update the image tag or if a rolling tag is used (latest, stable) you can force a new deployment in ECS to start an instance with the new image. If existing configs or saves stored in EFS are incompatible, they have to be replaced in the EFS volume. One way to do this is to simply remove them. They will be re-created once a new Factorio ECS instance boots.
