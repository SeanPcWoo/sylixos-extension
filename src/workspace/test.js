const os = require('os')

let  a = {
    v:1,
    arr:[1, 2,3],
    testa:1
}
let  b = {
    v:1,
    arr:[3, 4,3],
    test:1
}
console.log(Object.assign(a, b));
// console.log(os.type());
// console.log(process.env);