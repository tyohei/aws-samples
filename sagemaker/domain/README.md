# Amazon SageMaker Studio Domain

## Deploy

```sh
cdk synth
cdk deploy
```

## Destroy

* First delete all apps in your domain (via SageMaker Management Console)
* Delete the stack as below.

```sh
cdk destroy  # will fail but don't worry
```

* Then manually delete the EFS file system created by SageMaker Studio.
    * Via EFS Management Console
    * The EFS file system should have a tag key named `ManagedByAmazonSageMakerResource`
* Then manually delete the security groups for the EFS file system created by SageMaker Studio.
    * Via VPC Management Console
    * The security groups should have a tag key named `ManagedByAmazonSageMakerResource`
    * There should be "two" security groups.
    * Each security group **depends on the other**, to delete the security groups you first need to **delete all of the inbound/outbound rules**
* Try deleting the stack again.
