# Python Userwatch Example

This example shows how you can use userwatch with python to identify users before they login or if they visit from multiple devices.

## getting started

```
# select the virtual env
python3 -m venv venv
source venv/bin/activate
# install dependencies
python3 -m pip install -r requirements.txt

# optional: If you need to install a new test version of userwatch-python from test pypi.
python3 -m pip install -i https://test.pypi.org/simple/ userwatch-python==0.0.5

# run dev server
python3 app.py --port 8001
```
