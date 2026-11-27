# hexitec-mhz-detector
HEXITEC-MHz top level control and general DAQ software



# Installation

1) Create the directory you want the project to go in
2) Create a python virtual environment for the project
3) Activate the environment
4) Clone this repository locally
5) Enter the directory and ensure you are on the right version using `git checkout`
6) Install pybind11 - this must be done first as a dependent module depends on it, and pip will not resolve installs until completion.
7) Install with `pip install` in the `control/` directory
8) `wget` the GUI from the version you have chosen, available as a resource on the versions page
9) Unpack the directory in `web/static/` to create `dist` there.

e.g. Bash commands to install the software
```bash
mkdir hexitec-detector ; cd hexitec-detector
python -m virtualenv venv-mhz
source venv-mhz/bin/activate

git clone https://github.com/stfc-aeg/hexitec-mhz-detector.git
cd hexitec-mhz-detector ; git checkout 0.5.0
pip install pybind11
cd control ; pip install .
cd web/static ; wget https://github.com/stfc-aeg/hexitec-mhz-detector/releases/download/0.5.0/app_build.tgz
tar -xvzf app_build.tgz
```

# Start the application

After installation, edit the configuration file in `web/config/odin.cfg` as needed - check the server HTTP address, local config directories under `acquisition`.

Start the application. This depends on an odin-data instance running; if done manually, this must be in a separate terminal.
```bash
source venv-mhz/bin/activate
cd hexitec-mhz-detector/control
odin_control --config web/config/odin.cfg
```

With this done, go to `http://<system.address>:8888` in your browser of choice to find the application.
N.B. it has only been tested in firefox and chrome.
