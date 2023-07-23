#!/bin/bash
node -r dotenv/config $1 | node ./dist/workers/jobLogger.cjs