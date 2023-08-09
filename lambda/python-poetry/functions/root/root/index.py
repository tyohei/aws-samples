import numpy as np
import requests


def handler(event, context):
    print(f'event: {event}')
    print(f'context: {context}')
    return {
        'statusCode': 200,
        'body': 'Hello, Lambda!',
        'versions': {
            'numpy': np.__version__,
            'requests': requests.__version__
        }
    }
