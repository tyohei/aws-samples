declare module "lib" {
  import { APIGatewayAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';

  export function authenticate(params: APIGatewayAuthorizerEvent): Promise<APIGatewayAuthorizerResult>;
}
