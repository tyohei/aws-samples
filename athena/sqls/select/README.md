# CREATE TABLE and SELECT

## Generate and Upload Data to S3 Bucket

```sh
python generate_data.py -n 1000
S3_BUCKET_NAME=$(aws cloudformation describe-stack-resources --stack-name Bucket-for-Athena --query 'StackResources[?ResourceType==`AWS::S3::Bucket`].PhysicalResourceId' --output text); echo "${S3_BUCKET_NAME}"
aws s3 cp data.csv s3://${S3_BUCKET_NAME}/select/data.csv
```

## CREATE TABLE

* Go to Athena Management Console and launch Query Editor
* Select
    * Data source: `AwsDataCatalog`
    * Database: `default`
* Replace S3_BUCKET_NAME as above

```sql
CREATE EXTERNAL TABLE IF NOT EXISTS sampleselect(
  `row_id` string,
  `alphabet` string
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES("separatorChar" = ",")
LOCATION 's3://{S3_BUCKET_NAME}/select/'
;
```

## SELECT

* Go to Athena's Management Console

```sql
SELECT * FROM "default"."sampleselect" limit 10;
```
