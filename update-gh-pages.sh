git checkout gh-pages && \
rm -Rv index.html images/ styles/ scripts/ &&
cp -Rv dist/* . && \
git status
