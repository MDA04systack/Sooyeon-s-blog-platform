const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ?
            walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function replaceColors() {
    const dirs = ['app', 'components'];
    let count = 0;

    dirs.forEach(dir => {
        walkDir(path.join(__dirname, dir), filePath => {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
                let content = fs.readFileSync(filePath, 'utf8');
                let newContent = content.replace(/indigo-/g, 'teal-');
                if (content !== newContent) {
                    fs.writeFileSync(filePath, newContent, 'utf8');
                    console.log(`Updated ${filePath}`);
                    count++;
                }
            }
        });
    });
    console.log(`Replaced in ${count} files.`);
}

replaceColors();
