const Writable = require('readable-stream').Writable
const Redis = require('ioredis')
const Parse = require('fast-json-parse')
const split = require('split2')
const pump = require('pump')
const path = require('path');
const Queue = require('bull');

const queues = {};

function timeToYYYYMMDD() {
    const date = new Date();
    return date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, "0") +
        date.getDate().toString().padStart(2, "0");
}

function shouldLog(body) {
    return body["logJob"];
}

/**
 * 
 * @param {*} name 
 * @returns {Queue.Queue<{logJob: string}>}
 */
function getQueue(name) {
    if (!queues[name]) {
        queues[name] = new Queue(name, {
            redis: {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
                password: process.env.REDIS_PASS,
            }
        });
    }
    return queues[name];
}


function jobLogger() {
    const splitter = split(function (line) {
        console.log(line)
        const parsed = new Parse(line)
        if (parsed.err) {
            this.emit('unknown', line, parsed.err)
            return
        }

        return parsed.value
    })
    function write(body, env, cb) {
        if (!shouldLog(body)) {
            return cb();
        }

        const queue = getQueue(body["logJob"]);
        queue
            .getJob(body["jobId"])
            .then(job => {
                if (job) {
                    const value = JSON.stringify(body);
                    job.log(value);
                }
            }).catch(err => {
                console.error(err);
            });

        cb();
    }

    const writable = new Writable({
        objectMode: true,
        writev(chunks, cb) {

            // @ts-ignore
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

if (require.main === module) {
    pump(process.stdin, jobLogger())
}