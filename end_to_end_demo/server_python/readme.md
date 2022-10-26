# Example server in Python

This example shows how you can use Upollo with python to identify users before they login or if they visit from multiple devices.

## Getting started

Firstly, set your Upollo private API key in `.env`. See our [Quickstart guide](https://upollo.ai/docs/quick-start#sign-up) on how to get an API key.

Then, run the development server by:

```
# select the virtual env
python3 -m venv venv
source venv/bin/activate
# install dependencies
python3 -m pip install -r requirements.txt

# run dev server
python3 app.py --port 8001
```
