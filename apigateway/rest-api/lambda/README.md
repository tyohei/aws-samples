# API Gateway REST API and Lambda Function (without Authorization)

## Deploy

```sh
npm install

# If you are using Finch instead of Docker
export CDK_DOCKER=finch
# If you are using Docker
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws

cdk synth
cdk deploy
```

## Invoke

```sh
curl https://{API_ID}/execute-api.ap-northeast-1.amazonaws.com/prod/
curl https://{API_ID}/execute-api.ap-northeast-1.amazonaws.com/prod/bye
```

## Destroy

```sh
cdk destroy
```

