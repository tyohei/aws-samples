import { APIGatewayProxyHandler } from 'aws-lambda';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export const handler: APIGatewayProxyHandler = async (event, context) => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  const path = event.path;

  // Radamally select cats or dogs
  let folder: string = '';
  if (getRandomInt(2) === 0) {
    folder = 'cats';
  } else {
    folder = 'dogs';
  }

  // Scoped IAM policy
  const scopedPolicy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          's3:ListBuckets',
          's3:GetObject'
        ],
        Resource: [
          process.env.BUCKET_ARN,
          process.env.BUCKET_ARN + '/' + folder + '/*'
        ],
      }
    ]
  });

  const client = new STSClient({});
  const assumeRoleInput = {
    RoleArn: process.env.ROLE_ARN,
    RoleSessionName: 'testSession',
    Policy: scopedPolicy,
    DurationSeconds: Number(60*30),  // 30 min
  };
  const assumeRoleCommand = new AssumeRoleCommand(assumeRoleInput);
  const assumeRoleResponse = await client.send(assumeRoleCommand);
  console.log(assumeRoleResponse);


  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, from Lambda from path ${path}!`,
      folder: folder,
      resposne: JSON.stringify(assumeRoleResponse),
    })
  };
};
