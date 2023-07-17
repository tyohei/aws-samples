import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event, context) => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  const path = event.path;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, from Lambda from path ${path}!`
    })
  };
};
