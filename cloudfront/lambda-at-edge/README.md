# CloudFront Distribution with Lambda@Edge Written in TypeScript

## Deploy

```sh
npm install

# If you are using Finch instead of Docker
export CDK_DOCKER=finch
# If you are using Docker
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws

cdk synth --region us-east-1
cdk deploy --region us-east-1
```

## Access

* Go to CloudFront Management Console
    * Copy FQDN
* Access via browers (HTTP GET request).
    * Should return "Hello, Lambda@Edge!"

## Develop

```sh
npm i -D esbuild

cd functions/edge
npm init -y
npm i -D @types/aws-lambda
```

## Resources

* https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html#lambdaedge
* https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.experimental.EdgeFunction.html
* https://aws.amazon.com/jp/blogs/news/lambda-managed-by-cdk/
* https://docs.aws.amazon.com/lambda/latest/dg/typescript-handler.html
