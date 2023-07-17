
## Deploy

* Follow the [Auth0 documentation](https://auth0.com/docs/customize/integrations/aws/aws-api-gateway-custom-authorizers)
    * First create an Auth0 API
    * Copy the tenant name from Settings
    * Copy the identifier of Auth0 API from API's Settings

```sh
npm install

cd functions/root
npm install
cd ../..

cd functions/authorizer
npm install
cd ../..

# If you are using Finch instead of Docker
export CDK_DOCKER=finch
# If you are using Docker
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws

cdk synth -c tokenIssuer="https://<TENANT_NAME>.<REGION>.auth0.com/" -c jwksUri="https://<TENANT_NAME>.<REGION>.auth0.com/.well-known/jwks.json" -c audience="<IDENTIFIER OF AUTH0 API>"
cdk deploy -c tokenIssuer="https://<TENANT_NAME>.<REGION>.auth0.com/" -c jwksUri="https://<TENANT_NAME>.<REGION>.auth0.com/.well-known/jwks.json" -c audience="<IDENTIFIER OF AUTH0 API>"
```

## Invoke

* Navigate to "Auth0 Dashboard > Applications > APIs" and select your Auth0 API
* Select "Test" and get the access token using `curl`
    * Copy the access token in the response
* Run following

```sh
curl https://<APIGW API ID>.execute-api.<REGION>.amazonaws.com/prod/ -H "Authorization: Bearer <ACCESS TOKEN>"
```

## Destroy

```sh
cdk destroy -c tokenIssuer="https://<TENANT_NAME>.<REGION>.auth0.com/" -c jwksUri="https://<TENANT_NAME>.<REGION>.auth0.com/.well-known/jwks.json" -c audience="<IDENTIFIER OF AUTH0 API>"
```


## Development

```sh
mkdir -p functions/root
cd functions/root
npm init -y
cd ../..

# The Lambda function is based on https://github.com/auth0-samples/jwt-rsa-aws-custom-authorizer
mkdir -p functions/authorizer
cd functions/authorizer
npm init -y
npm i auth0
npm i jsonwebtoken
npm i jwks-rsa
cd ../..
```

## References

* https://auth0.com/docs/customize/integrations/aws/aws-api-gateway-custom-authorizers
* https://github.com/auth0-samples/jwt-rsa-aws-custom-authorizer
