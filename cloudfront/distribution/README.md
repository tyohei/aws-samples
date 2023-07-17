# Amazon CloudFront with Standard Log Enabled

## Deploy

```sh
cdk synth --region us-east-1
cdk deploy --region us-east-1
```

## Access

* Access to CloudFront Mangement Console and copy the distribution ID.
* Access to `https://{DISTRIBUTION_ID}.cloudfront.net/index.html`

## Destory

```sh
cdk destroy --region us-east-1
```
