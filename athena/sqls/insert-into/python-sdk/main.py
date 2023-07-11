import argparse
import json

import boto3

client = boto3.client('athena')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output_location', '-o', required=True)
    args = parser.parse_args()

    response = client.start_query_execution(
        QueryString="INSERT INTO default.sampleinsertinto VALUES ('3024', 'PYTHON')",  # NOQA
        ResultConfiguration={
            'OutputLocation': args.output_location
        }
    )
    print(json.dumps(response))


if __name__ == '__main__':
    main()
