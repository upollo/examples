# Example server in Node.js

## Getting Started

Firstly, install the dependencies:

```bash
cd functions
npm install
```

Secondly, set your Upollo private API key in `.env`. See our [Quickstart guide](https://upollo.ai/docs/quick-start#sign-up) on how to get an API key.

Thirdly, set the name of your Firebase project in `.firebaserc`.

Finally, run the development server:

```bash
cd functions
npm run serve
```

The development server API will be available on `http://localhost:5001/<Firebase Project name>/<Region>`
