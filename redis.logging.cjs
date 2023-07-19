const Writable = require('readable-stream').Writable
const Redis = require('ioredis')
const Parse = require('fast-json-parse')
const split = require('split2')
const pump = require('pump')
const minimist = require('minimist')
const fs = require('fs');
const path = require('path');

const key = 'xlog';
const redisLogPrefix = `logs:fast`;

function timeToYYYYMMDD() {
    const date = new Date();
    return date.getFullYear().toString()+
    (date.getMonth()+1).toString().padStart(2,"0")+
    date.getDate().toString().padStart(2,"0");
}

function shouldLog(body) {
    return body[key];
}

function pinoRedis(opts) {
    console.log('opts', opts)
    const splitter = split(function(line) {
        console.log(line)
        const parsed = new Parse(line)
        if (parsed.err) {
            this.emit('unknown', line, parsed.err)
            return
        }

        return parsed.value
    })

    const redis = new Redis(opts.connectionUrl)

    function write(body, env, cb) {
        if(!shouldLog(body)) {
            return cb();
        }

        const ttl = body.ttl || 60
        
        const value = JSON.stringify(body);
        const redisKey = redisLogPrefix+":"+timeToYYYYMMDD()+":"+key
        redis.lpush(redisKey, value);
        redis.exp(redisKey, ttl);
        cb();
    }

    const writable = new Writable({
        objectMode: true,
        writev(chunks, cb) {
            const pipeline = redis.pipeline()
            chunks.forEach(item => {
                const body = item.chunk
                write(body, null, cb);
            })
        },
        write: write,
    })

    pump(splitter, writable)

    return splitter
}

module.exports = pinoRedis

function start(opts) {
    if (opts.help) {
        console.log(fs.readFileSync(path.join(__dirname, './options.txt'), 'utf8'))
        return
    }
    if (opts.version) {
        console.log('pino-redis', require('./package.json').version)
        return
    }

    pump(process.stdin, pinoRedis(opts))
}

if (require.main === module) {
    start(
        minimist(process.argv.slice(2), {
            alias: {
                version: 'v',
                help: 'h',
                connectionUrl: 'U'
            },
            default: {
                connectionUrl: 'redis://:@localhost:6379'
            }
        })
    )
}