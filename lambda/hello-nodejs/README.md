# AWS Lambda Function (Node.js)

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
aws lambda invoke --function-name Lambda-Hello-Nodejs-Function********************* out.json
```

## Destroy

```sh
cdk destroy
```


## Develop

```sh
mkdir -p functions/root
cd functions/root

npm init -y
npm i -D esbuild
npm i -D @types/aws-lambda
```
