# Cognito User Pool with a Single User

## Deploy

```sh
npm install

# If you are using Finch instead of Docker
export CDK_DOCKER=finch
# If you are using Docker
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws

cdk synth -c myEmail="<Your email address>"
cdk deploy -c myEmail="<Your email address>"
```

## Invoke

```sh
cd scripts
python invoke.py -t <token sent to your email address>
# NOTE: New password for the Cognito User Pools' user is hard-coded in the invoke.py script.
```

## Delete

```sh
cdk destroy
```
