#!/bin/bash

# usage: ./bump_version.sh 1.0.5-alpha

if [ -z "$1" ]; then
    echo "Usage: ./bump_version.sh <new_version>"
    exit 1
fi

NEW_VERSION=$1
echo "Bumping version to $NEW_VERSION..."

# 1. Update VERSION file
echo "$NEW_VERSION" > VERSION
echo "✅ Updated VERSION"

# 1.5 Update .env file (APP_VERSION)
if grep -q "APP_VERSION=" .env; then
    # Modify existing line
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/APP_VERSION=.*/APP_VERSION=$NEW_VERSION/" .env
    else
      sed -i "s/APP_VERSION=.*/APP_VERSION=$NEW_VERSION/" .env
    fi
else
    # Append if not exists
    echo "APP_VERSION=$NEW_VERSION" >> .env
fi
echo "✅ Updated .env"

# 2. Update frontend/package.json
# Using sed for cross-platform compatibility (macOS vs Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json
else
  sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json
fi
echo "✅ Updated frontend/package.json"

# 3. Update README.md badge
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/version-.*-blue/version-$NEW_VERSION-blue/" README.md
else
  sed -i "s/version-.*-blue/version-$NEW_VERSION-blue/" README.md
fi
echo "✅ Updated README.md"

echo "🎉 Version bumped to $NEW_VERSION"
echo "Don't forget to push: git push origin main --tags"
