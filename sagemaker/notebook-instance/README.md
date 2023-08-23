# Amazon SageMaker Notebook Instance

## Deploy

```sh
# Choose your instance type
aws pricing get-attribute-values --attribute-name instanceType --service-code AmazonSageMaker --query 'AttributeValues[*].[Value]' --output text --region us-east-1

cdk synth -c instanceType='ml.m5.xlarge'
cdk deploy -c instanceType='ml.m5.xlarge'
```

## Destroy

```sh
cdk destroy -c instanceType='ml.m5.xlarge'
```
