import { CloudFrontEvent, CloudFrontRequestCallback, Context } from 'aws-lambda';

export const handler = function(event: CloudFrontEvent, context: Context, callback: CloudFrontRequestCallback): void {
  console.log(event);
  console.log(context);

  const responseToClient = {
    status: '200',
    statusDescription: 'OK',
    body: 'Hello, Lambda@Edge!'
  };

  callback(null, responseToClient);
};
