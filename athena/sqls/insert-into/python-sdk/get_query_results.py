import argparse
import json

import boto3

client = boto3.client('athena')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--id', '-i', required=True)
    parser.add_argument('--next_token', '-n')
    args = parser.parse_args()

    if args.next_token is not None:
        response = client.get_query_results(
            QueryExecutionId=args.id,
            NextToken=args.next_token
        )
    else:
        response = client.get_query_results(
            QueryExecutionId=args.id
        )
    print(json.dumps(response))


if __name__ == '__main__':
    main()
