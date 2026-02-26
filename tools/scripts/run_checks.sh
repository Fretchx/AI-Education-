#!/usr/bin/env bash
set -euo pipefail

python -m compileall backend/app agents/tools tools/integrations
PYTHONPATH=backend pytest -q backend/tests
