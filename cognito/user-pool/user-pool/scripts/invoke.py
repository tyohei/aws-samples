import argparse
import pprint

import boto3

import get_tokens

# Consts
USER_NAME = 'dev'
NEW_PASSWORD = 'ynC9Nq_RRbE3*GfzPd'
REGION = 'ap-northeast-1'

# AWS clients
cognito_idp = boto3.client('cognito-idp')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--token', '-t',
                        help='Token sent to your email.', required=True)
    args = parser.parse_args()

    res = cognito_idp.list_user_pools(MaxResults=12)
    user_pool_id: str = None
    for x in res['UserPools']:
        if x['Name'].startswith('UserPool'):
            user_pool_id = x['Id']
    assert user_pool_id is not None
    print(user_pool_id)

    res = cognito_idp.list_user_pool_clients(UserPoolId=user_pool_id)
    client_id = res['UserPoolClients'][0]['ClientId']
    print(client_id)

    res = cognito_idp.describe_user_pool_client(
        UserPoolId=user_pool_id,
        ClientId=client_id)
    client_secret = res['UserPoolClient']['ClientSecret']
    print(client_secret)

    args.__setattr__('username', USER_NAME)
    args.__setattr__('old_password', args.token)
    args.__setattr__('new_password', NEW_PASSWORD)
    args.__setattr__('user_pool_id', user_pool_id)
    args.__setattr__('client_id', client_id)
    args.__setattr__('client_secret', client_secret)
    args.__setattr__('region', REGION)

    tokens = get_tokens.get_tokens(args)
    pprint.pprint(tokens)


if __name__ == '__main__':
    main()
