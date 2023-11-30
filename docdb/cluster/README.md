# Amazon DocumentDB Cluster

## Deploy

```sh
cdk synth
cdk deploy
```

## Access

```sh
aws ec2 describe-instances \
    --filters \
        Name=tag:Name,Values="DocumentDB-Cluster/Instance" \
        Name=instance-state-name,Values=running \
    --query 'Reservations[].Instances[].InstanceId' \
    --output text

aws ssm start-session \
    --target $(
        aws ec2 describe-instances \
        --filters \
        Name=tag:Name,Values="DocumentDB-Cluster/Instance" \
        Name=instance-state-name,Values=running \
        --query 'Reservations[].Instances[].InstanceId' \
        --output text
    )

```


## Install MongoDB Shell

* https://www.mongodb.com/docs/mongodb-shell/
* [DocumentDB supports MongoDB compatibility including MongoDB 4.0 and MongoDB 5.0](https://docs.aws.amazon.com/documentdb/latest/developerguide/compatibility.html), so you need to edit the repo file from the document.

```sh
sudo vim /etc/yum.repos.d/mongodb-org-5.0.repo
# Paste below
```

```txt
[mongodb-org-5.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/$releasever/mongodb-org/5.0/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-5.0.asc
```

```sh
yum search mongodb-mongosh
sudo yum install mongodb-mongosh
mongosh --version

yum search git
sudo yum install git
```


## Connect to DocumentDB

* Go to Amazon DocumentDB Management Console
    * Select your cluster
    * Copy the command that is downloading the CA certificate under "Connect"
* Go to AWS Secrets Manager Management Console
    * Select the secret created by CDK
    * Retrieve the secret value
    * Copy the password

```sh
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

mongosh \
    --tls \
    --tlsCertificateKeyFile global-bundle.pem \
    --host <ID>.<REGION>.docdb.amazonaws.com \
    --port 27017 \ 
    --username myuser \
    --password
```
