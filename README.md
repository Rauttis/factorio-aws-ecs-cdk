# factorio-aws-ecs-cdk

AWS CDK project that deploys the infrastructure needed to run Factorio in ECS.

The stack creates:

- EFS for storing saves
- ECS cluster
- ECS Fargate task definition
- ECS Fargate service

## Configuration

Configuration is done via environment variables. .env files are also supported (see `.env-example`).

| Variable  | Description | Default |
| --------- | ------------| ------- |
| CPU       | The amount of cpu to assign for the server <br> The supported CPU/Memory combinations can be found [here](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html) | 256 |
| MEMORY    | The amount of memory to assign for the server <br> The supported CPU/Memory combinations can be found [here](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html) | 1024 |
| IMAGE_TAG | The version tag of the factorio docker image you want to use <br> Supported tags can be found [here](https://hub.docker.com/r/factoriotools/factorio/) | stable |

## Deployment

```
$ npm i
$ npm run deploy
```

## Connecting to the server

You can use the public IP found in the ECS task details.

## Updating Factorio

Update the image tag or if a rolling tag is used (latest, stable) you can force a new deployment in ECS to start an instance with the new image. If existing configs or saves stored in EFS are incompatible, they have to be replaced in the EFS volume. One way to do this is to simply remove them. They will be re-created once a new Factorio ECS instance boots.

## Deleting the server

Delete the Factorio stack from the Cloudformation dashboard or run `npm run destroy`. Note that this destroys everything, including the EFS volume that contains your saves.
