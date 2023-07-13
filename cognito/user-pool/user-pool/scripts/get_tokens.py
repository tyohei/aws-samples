import argparse

import boto3

import authentication_helper


def initiate_auth(cognito_idp, args, helper):
    auth_parameters = helper.get_auth_parameters()
    res = cognito_idp.initiate_auth(
        ClientId=args.client_id,
        AuthFlow='USER_SRP_AUTH',
        AuthParameters=auth_parameters)
    assert res['ChallengeName'] == 'PASSWORD_VERIFIER'
    return res


def challenge_password_verifier(cognito_idp, args, helper, res):
    challenge_responses = helper.get_challenge_responses_password_verifier(
        res['ChallengeParameters'])
    res = cognito_idp.respond_to_auth_challenge(
        ClientId=args.client_id,
        ChallengeName=res['ChallengeName'],
        ChallengeResponses=challenge_responses)
    return res


def challenge_new_password_required(cognito_idp, args, helper, res):
    challenge_responses = helper.get_challenge_responses_new_password_required(
        res['ChallengeParameters'], args.new_password)
    session = res['Session']
    res = cognito_idp.respond_to_auth_challenge(
        ClientId=args.client_id,
        Session=session,
        ChallengeName=res['ChallengeName'],
        ChallengeResponses=challenge_responses)
    return res


def get_tokens(args):
    cognito_idp = boto3.client('cognito-idp', region_name=args.region)

    helper = authentication_helper.AuthenticationHelper(
        args.username,
        args.old_password,
        args.user_pool_id,
        args.client_id,
        args.client_secret
    )
    res = initiate_auth(cognito_idp, args, helper)

    try:
        res = challenge_password_verifier(cognito_idp, args, helper, res)
    except Exception as e:
        if (not hasattr(e, 'response')) \
                or ('Error' not in e.response) \
                or ('Code' not in e.response['Error']) \
                or ('NotAuthorizedException' != e.response['Error']['Code']):
            raise e
        helper = authentication_helper.AuthenticationHelper(
            args.username,
            args.new_password,
            args.user_pool_id,
            args.client_id,
            args.client_secret
        )
        res = initiate_auth(cognito_idp, args, helper)
        res = challenge_password_verifier(cognito_idp, args, helper, res)

    if 'ChallengeName' in res:
        if res['ChallengeName'] == 'NEW_PASSWORD_REQUIRED':
            res = challenge_new_password_required(
                cognito_idp, args, helper, res)
        else:
            raise NotImplementedError

    return res['AuthenticationResult']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--username', required=True)
    parser.add_argument('--old_password', required=True)
    parser.add_argument('--new_password', required=True)
    parser.add_argument('--user_pool_id', required=True)
    parser.add_argument('--client_id', required=True)
    parser.add_argument('--client_secret', required=True)
    parser.add_argument('--region', default='ap-northeast-1')
    args = parser.parse_args()

    print(get_tokens(args))


if __name__ == '__main__':
    main()
