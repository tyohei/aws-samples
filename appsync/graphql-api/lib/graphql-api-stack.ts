import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { Construct } from 'constructs';

export class GraphqlApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userTable = new ddb.Table(this, 'UserTable', {
      partitionKey: {
        name: 'userId',
        type: ddb.AttributeType.STRING
      }
    });

    const api = new appsync.GraphqlApi(this, 'API', {
      name: 'lab',
      schema: appsync.SchemaFile.fromAsset(path.join(__dirname, '../graphql/schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM,
        }
      },
      xrayEnabled: true,
      logConfig: {
        retention: logs.RetentionDays.ONE_WEEK
      }
    });

    const userDataSource = api.addDynamoDbDataSource('UserDataSource', userTable);

    userDataSource.createResolver('listUsersResolver', {
      typeName: 'Query',
      fieldName: 'listUsers',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    userDataSource.createResolver('getUser', {
      typeName: 'Query',
      fieldName: 'getUser',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem('userId', 'userId'),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem()
    });

    userDataSource.createResolver('addUser', {
      typeName: 'Mutation',
      fieldName: 'addUser',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbPutItem(
        appsync.PrimaryKey.partition('userId').auto(),
        appsync.Values.projecting('input'),
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem()
    });
  }
}
