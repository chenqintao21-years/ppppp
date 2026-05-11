const http = require('http');

const location = encodeURIComponent('长沙');
const path = `/api/attractions/search?location=${location}&page=1&limit=5`;

const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: 'GET'
};

console.log('测试 API: http://localhost:3000' + path + '\n');

const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(`响应头: ${JSON.stringify(res.headers)}\n`);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('响应数据:');
            console.log(JSON.stringify(json, null, 2));

            if (json.success && json.data) {
                console.log(`\n找到 ${json.data.length} 个景点`);
            }
        } catch (e) {
            console.log('原始响应:', data);
        }
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error(`请求失败: ${e.message}`);
    process.exit(1);
});

req.end();
