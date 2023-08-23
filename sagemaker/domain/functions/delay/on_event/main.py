import time
import uuid


def on_event(event, context):
    # https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources-readme.html
    print(f'event: {event}')
    request_type = event['RequestType']

    if request_type == 'Create':
        time_to_wait = int(event['ResourceProperties']['TimeToWait'])
        wait(time_to_wait)
        return {'PhysicalResourceId': str(uuid.uuid4())}
    elif request_type in ['Update', 'Delete']:
        return
    else:
        raise Exception(f'Invalid request type: {request_type}')


def wait(time_to_wait):
    print(f'Waiting for {time_to_wait} seconds')
    time.sleep(time_to_wait)
    print('Waiting finished')
