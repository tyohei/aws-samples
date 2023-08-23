import uuid

import boto3

sm_client = boto3.client('sagemaker')
sc_client = boto3.client('servicecatalog')


def on_event(event, context):
    # https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources-readme.html
    print(f'event: {event}')
    request_type = event['RequestType']

    if request_type == 'Create':
        execution_role = event['ResourceProperties']['ExecutionRole']
        enable_projects(execution_role)
        return {'PhysicalResourceId': str(uuid.uuid4())}
    elif request_type in ['Update', 'Delete']:
        return
    else:
        raise Exception(f'Invalid request type: {request_type}')


def enable_projects(studio_role_arn):
    # Enable SageMaker Project on account level (accepts portfolio share)
    response = sm_client.enable_sagemaker_servicecatalog_portfolio()

    # Associate SageMaker Studio role with portfolio
    response = sc_client.list_accepted_portfolio_shares()

    portfolio_id = ''
    for portfolio in response['PortfolioDetails']:
        if portfolio['ProviderName'] == 'Amazon SageMaker':
            portfolio_id = portfolio['Id']

    response = sc_client.associate_principal_with_portfolio(
        PortfolioId=portfolio_id,
        PrincipalARN=studio_role_arn,
        PrincipalType='IAM'
    )
