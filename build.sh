#!/usr/bin/env bash

set -e

IMAGE_NAME="amikhalev/sprinklers3"
BUILD_IMAGE="$IMAGE_NAME:build"
DIST_IMAGE="$IMAGE_NAME:dist"
EXTRACT_CONTAINER="extract-$RANDOM"
BUILD_DIR="."

echo "Cleaning build files"
rm -rf ./build ./dist ./public

echo "Building build image $BUILD_IMAGE"
docker build -t "$BUILD_IMAGE" --target builder .

echo "Extracting build image using container $EXTRACT_CONTAINER"
mkdir -p ./build
cp package.json yarn.lock "$BUILD_DIR"
docker container create --name "$EXTRACT_CONTAINER" "$BUILD_IMAGE"
docker container cp "$EXTRACT_CONTAINER:/app/dist" "$BUILD_DIR/dist"
docker container cp "$EXTRACT_CONTAINER:/app/public" "$BUILD_DIR/public"
docker container rm -f "$EXTRACT_CONTAINER"

echo "Building dist image $DIST_IMAGE"
docker build -t "$DIST_IMAGE" .