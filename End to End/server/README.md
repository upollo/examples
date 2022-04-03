## Getting Started

First, install the dependencies:

```bash
npm install
```

Secondly set your Userwatch private api key in functions/index.js

Thirdly, run the development server:

```bash
firebase emulators:start --inspect-functions --only functions
```


The API will be available on http://localhost:5001/<Firebase Project name>/<Region>

