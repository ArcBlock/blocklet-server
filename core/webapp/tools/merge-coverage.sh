#!/usr/bin/env bash

TMP_DIR=coverage-report
TMP_FINAL_DIR=coverage-final
SRC_DIR=coverage
API_DIR=coverage-api
E2E_DIR=coverage-e2e
NYC_OUTOUT_DIR=.nyc_output
JSON_FILE=coverage-final.json
FINAL_DIR=coverage

rm -rf $TMP_DIR
mkdir -p $TMP_DIR

rm -rf $TMP_FINAL_DIR
mkdir -p $TMP_FINAL_DIR

rm -rf $NYC_OUTOUT_DIR
mkdir -p $NYC_OUTOUT_DIR


cp $SRC_DIR/$JSON_FILE $TMP_DIR/from-$SRC_DIR.json
cp $API_DIR/$JSON_FILE $TMP_DIR/from-$API_DIR.json
cp $E2E_DIR/$JSON_FILE $TMP_DIR/from-$E2E_DIR.json

nyc merge ${TMP_DIR} && mv coverage.json .nyc_output/out.json

echo "generate coverage-report into ./${TMP_FINAL_DIR}"
nyc report --reporter lcov --report-dir ${TMP_FINAL_DIR}

echo "clean coverage dirs"
rm -rf $TMP_DIR
rm -rf $NYC_OUTOUT_DIR
rm -rf $SRC_DIR
rm -rf $API_DIR
rm -rf $E2E_DIR
rm -rf $FINAL_DIR

echo "move coverage-report from ./${TMP_FINAL_DIR} to ./${FINAL_DIR}"
mv $TMP_FINAL_DIR $FINAL_DIR
