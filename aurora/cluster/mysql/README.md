# Amazon Aurora for MySQL

## Deploy

```sh
cdk synth -c myIpAddress="$(curl --no-progress-meter https://checkip.amazonaws.com/)/32"
cdk deploy -c myIpAddress="$(curl --no-progress-meter https://checkip.amazonaws.com/)/32"
```

## Access

```sh
aws ec2 describe-instances \
    --filters \
        Name=tag:Name,Values="Aurora-MySQL/Instance" \
        Name=instance-state-name,Values=running \
    --query 'Reservations[].Instances[].InstanceId' \
    --output text

aws ssm start-session \
    --target $(
        aws ec2 describe-instances \
        --filters \
        Name=tag:Name,Values="Aurora-MySQL/Instance" \
        Name=instance-state-name,Values=running \
        --query 'Reservations[].Instances[].InstanceId' \
        --output text
    )
```

## Install MySQL Client and Git

* MySQL client's repository is not installed into Amazon Linux 2023 by default.
* You need to find the package from [MySQL homepage](https://dev.mysql.com/downloads/repo/yum/)
    * Amazon Linux 2023 is based on [Fedora 34, 35, and 36](https://docs.aws.amazon.com/linux/al2023/ug/relationship-to-fedora.html).
    * However, you need need RHEL 9 package (cf., [Devlopers.IO](https://dev.classmethod.jp/articles/install-mysql-client-to-amazon-linux-2023/))

```sh
sudo dnf install https://dev.mysql.com/get/mysql80-community-release-el9-1.noarch.rpm
dnf search mysql
sudo dnf install mysql-community-client
mysql --version

dnf search git
sudo dnf install git
git --version
```

## Connect to MySQL

* Go to Amazon RDS Management Console
    * Copy your cluster endpoint.
* Go to AWS Secrets Manager Management Console
    * Username and password should be stored in Secrets Manager.

```sh
mysql -u admin -p -h <CLUSTER_ENDPOINT>
# Enter the password stored in Secrets Manager.
```

```mysql
SHOW DATABASES;
SHOW TABLES FROM sys;
exit;
```

## Create Test Database

* See [MySQL documentation](https://dev.mysql.com/doc/index-other.html) for list of example database.

```sh
git clone https://github.com/datacharmer/test_db

cd test_db
mysql -u admin -p -h <CLUSTER_ENDPOINT> < employees.sql
mysql -u admin -p -h <CLUSTER_ENDPOINT>
```

## Query the Database

```mysql
SHOW DATABASES;
USE employees;
SHOW TABLES;
SHOW COLUMNS FROM employees;

SELECT * FROM employees LIMIT 10;
```

## Delete

```sh
cdk destroy -c myIpAddress="$(curl --no-progress-meter https://checkip.amazonaws.com/)/32"
```
