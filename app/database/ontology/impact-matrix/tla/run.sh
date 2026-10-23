#!/usr/bin/env bash
# Regenerates the data module, model-checks the reviewer with TLC, dumps every reachable
# state and checks each one against review-matrix.js.
# Usage: bash app/database/ontology/impact-matrix/tla/run.sh [path to tla2tools.jar or the tlatools plugin directory]
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
TOOLS="${1:-${TLA_TOOLS:-C:\\Users\\Fonta\\OneDrive - San Francisco State University\\Desktop\\toolbox\\plugins\\org.lamport.tlatools_1.0.0.201302251534}}"
cd "$HERE"
node gen-data.js
rm -rf states Reviewer.dump
java -Xmx2g -cp "$TOOLS" tlc2.TLC -workers 4 -dump Reviewer.dump -config Reviewer.cfg Reviewer.tla | tee tlc.log
node conformance.js Reviewer.dump
