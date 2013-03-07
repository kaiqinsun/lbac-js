rm -Rv temp/dist
cp -Rv dist/ temp/dist && \
git checkout gh-pages && \
rm -Rv index.html images/ styles/ scripts/ &&
cp -Rv temp/dist/* . && \
git status
