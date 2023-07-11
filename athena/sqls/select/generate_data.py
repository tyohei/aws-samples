import argparse
import csv
import string


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--num_rows', '-n', type=int, default=100)
    parser.add_argument('--filename', '-f', default='data.csv')
    args = parser.parse_args()

    table = []
    for i in range(args.num_rows):
        table.append([i, string.ascii_lowercase[i % 26]])

    with open(args.filename, 'w') as f:
        writer = csv.writer(f)
        writer.writerows(table)


if __name__ == '__main__':
    main()
