# CREATE TABLE and INSERT INTO

## Generate and Upload Data to S3 Bucket

```sh
python generate_data.py -n 1000
S3_BUCKET_NAME=$(aws cloudformation describe-stack-resources --stack-name Bucket-for-Athena --query 'StackResources[?ResourceType==`AWS::S3::Bucket`].PhysicalResourceId' --output text); echo "${S3_BUCKET_NAME}"
aws s3 cp data.csv s3://${S3_BUCKET_NAME}/insert-into/data.csv
```

## CREATE TABLE

* Go to Athena Management Console and launch Query Editor
* Select
    * Data source: `AwsDataCatalog`
    * Database: `default`
* Replace S3_BUCKET_NAME as above

```sql
CREATE EXTERNAL TABLE IF NOT EXISTS sampleinsertinto(
  `row_id` string,
  `alphabet` string
)
ROW FORMAT DELIMITED
  FIELDS TERMINATED BY ','
  ESCAPED BY '\\'
  LINES TERMINATED BY '\n'
LOCATION 's3://{S3_BUCKET_NAME}/insert-into/'
;
```

## SELECT

* Go to Athena Management Console and launch Query Editor
* Select
    * Data source: `AwsDataCatalog`
    * Database: `default`

```sql
SELECT * FROM "default"."sampleinsertinto" limit 10;
```

## INSERT INTO

* Go to Athena Management Console and launch Query Editor
* Select
    * Data source: `AwsDataCatalog`
    * Database: `default`


```sql
INSERT INTO default.sampleinsertinto VALUES ('3002', 'QUERY_EDITOR');
```

* Check the table again

```sql
SELECT * FROM "default"."sampleinsertinto" limit 10;
SELECT * FROM "default"."sampleinsertinto" WHERE row_id = '3002';
```

### Python Example

```sh
cd python-sdk/

S3_BUCKET_NAME=$(aws cloudformation describe-stack-resources --stack-name Bucket-for-Athena --query 'StackResources[?ResourceType==`AWS::S3::Bucket`].PhysicalResourceId' --output text); echo "${S3_BUCKET_NAME}"
python main.py -o s3://${S3_BUCKET_NAME}/outputs/
python get_query_results.py -i <EXECUTION_ID>
```

### Go Example

