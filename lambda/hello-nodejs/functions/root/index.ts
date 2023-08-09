import { Context } from 'aws-lambda';


// https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/aws-lambda
export const handler = async (event: any, context: Context): Promise<any> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  return {
    statusCode: 200,
    body: 'Hello, Lambda!!!'
  }
};

