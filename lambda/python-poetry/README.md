# AWS Lambda Function (Python with Poetry)

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
aws lambda invoke --function-name Lambda-Python-Poetry-Function********************* out.json

```

## Destroy

```sh
cdk destroy
```


## Develop

* https://docs.aws.amazon.com/cdk/api/v2/docs/aws-lambda-python-alpha-readme.html


```sh
npm i -D @aws-cdk/aws-lambda-python-alpha

mkdir -p functions
cd functions

poetry self update
poetry new root

cd root
poetry add numpy
poetry add requests
```


