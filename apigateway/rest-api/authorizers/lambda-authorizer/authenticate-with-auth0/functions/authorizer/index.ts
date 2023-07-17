// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/aws-lambda/trigger/api-gateway-authorizer.d.ts
import { APIGatewayAuthorizerHandler, APIGatewayAuthorizerResult } from 'aws-lambda';
import * as lib from './lib';

let response;

export const handler: APIGatewayAuthorizerHandler = async (event, context) => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  try {
    response = await lib.authenticate(event);
  } catch(err) {
    console.log(err);
    return context.fail('Unauthorized');
  }

  return response;
}
