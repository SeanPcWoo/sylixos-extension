const fs = require('fs');

const jsonHelper = {
  jsonReader(filePath, cb) {
    fs.readFile(filePath, (err, fileData) => {
      if (err) {
        return cb && cb(err);
      }
      try {
        const object = JSON.parse(fileData);
        return cb && cb(null, object);
      } catch (err) {
        return cb && cb(err);
      }
    });
  },

  writeJson2File(file, jsondata){
    fs.writeFileSync(file, JSON.stringify(jsondata));
  },

  readJsonFromFile(file){
    let content;
    try {
      content = fs.readFileSync(file);
      return JSON.parse(content);
    } catch (e) { return null; }
  },

  async jsonReaderPromise(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, fileData) => {
        if (err) {
          reject(err);
        }

        try {
          const object = JSON.parse(fileData);
          resolve(object);
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}

module.exports = jsonHelper;