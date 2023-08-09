# AWS Lambda Function (Node.js)

## Deploy

```sh
npm install

cdk synth
cdk deploy
```

## Invoke

```sh
aws lambda invoke --function-name Lambda-Hello-Python-Function********************* out.json
```

## Destroy

```sh
cdk destroy
```


## Develop

```sh
mkdir -p functions/root
cd functions/root

touch __init__.py
vim main.py
```

