const xml2js = require('xml2js');
const fs = require('fs');
const util = require('util');
const path = require('path');
const exists = util.promisify(require('fs').exists);

const parseString = util.promisify(xml2js.parseString);

const xmlHelper = {
    /* 获取 xml 文件内容 */
    async getXmlContent2File(file) {
        if (!await exists(file)) {
            return null;
        }
        const configString = fs.readFileSync(file, 'utf8');
        try {
            return await parseString(configString, { explicitArray: false });
        } catch (err) {
            console.error(err)
            return null;
        }
    },

    /* 向文件写入 xml 内容 */
    setXmlContent2File(file, contentJson) {
        const builder = new xml2js.Builder();
        const xml = builder.buildObject(contentJson);
        fs.writeFileSync(file, xml);
    },


}

module.exports = xmlHelper;