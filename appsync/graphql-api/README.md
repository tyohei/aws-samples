# AWS AppSync with Amazon DynamoDB Data Store

## Deploy

```sh
npm update -g
npm update
cdk synth
cdk deploy
```

## Test

* Go to AppSync console: https://us-east-1.console.aws.amazon.com/appsync/home?region=us-east-1#/apis
* Click "lab" API
* Click "Run a query"
* Click "Run a query"
* Enter following

```graphql
# Query
query {
  listUsers {
    userId
  }
}

# Mutation
mutation {
  addUser(input: {firstName: "Yohei", lastName: "Tsuji"}) {
    userId
  }
}

# Query
query {
  listUsers {
    userId
  }
}

query {
  getUser(userId: "") {
    firstName
    lastName
  }
}
```
