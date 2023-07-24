# IPv4 VPC with Four Subnets

## Deploy

```sh
cdk synth -c myIpAddress="$(curl --no-progress-meter https://checkip.amazonaws.com/)/32"
cdk deploy -c myIpAddress="$(curl --no-progress-meter https://checkip.amazonaws.com/)/32"
```
