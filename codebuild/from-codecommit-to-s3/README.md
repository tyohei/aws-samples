# CodeBuild for Next.js (Source is CodeCommit and Target is S3)

## Deploy

```sh
cd frontend/example
git clean -dfXn  # check files
git clean -dfX

cdk synth
cdk deploy
```

## Build

* Go to CodeBuild Management Console
* Select the project you have deployed
* Click "Start build"

## Access

* Go to S3 Management Console
* Select the bucket you have deployed
* Copy the prefix of `index.html`

* Go to CloudFront Management Console
* Select the distribution you have deployed
* Copy the FQDN, add the prefix you have copied above, and paste it to the browser URL bar.

* NOTE: CSS and JavaScript will not laod correctly due to [this issue](https://github.com/vercel/next.js/discussions/32216).

## Destroy

```sh
cdk destroy
```

## Develop

### Initialize the Code

* https://react.dev/learn/start-a-new-react-project

```sh
mkdir frontend
cd frontend

npm init -y
npx create-next-app
# Select defaults (project name: example)

cd example
vim next.config.js
# Change nextConfig as this doc (https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
npx next build
```

### Update the Code

```sh
cd frontend/example
npm i
```
